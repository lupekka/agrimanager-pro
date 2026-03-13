import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Animal, Transaction, Product, Task } from '../types';

export const pdfService = {
  /**
   * Esporta la lista animali in PDF
   * Ordinamento: per specie, poi per microchip (alfabetico)
   */
  exportAnimalList: (animals: Animal[]) => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('it-IT');
    
    // Intestazione
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Registro Animali', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generato il ${today}`, 14, 28);
    doc.text(`Totale capi: ${animals.length}`, 14, 35);
    
    // Ordina per specie, poi per microchip
    const sorted = [...animals].sort((a, b) => {
      if (a.species !== b.species) {
        return a.species.localeCompare(b.species);
      }
      return a.microchip.localeCompare(b.microchip);
    });
    
    // Crea tabella
    autoTable(doc, {
      head: [['Microchip', 'Nome', 'Specie', 'Data Nascita', 'Padre', 'Madre', 'Note', 'Trattamenti']],
      body: sorted.map(a => [
        a.microchip,
        a.nome || '-',
        a.species,
        a.birthDate ? new Date(a.birthDate).toLocaleDateString('it-IT') : '-',
        a.sire || '-',
        a.dam || '-',
        a.notes || '-',
        a.treatments?.length.toString() || '0'
      ]),
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [4, 120, 87] },
      alternateRowStyles: { fillColor: [245, 245, 240] }
    });
    
    doc.save(`animali_${today.replace(/\//g, '-')}.pdf`);
  },

  /**
   * Esporta le transazioni finanziarie in PDF
   * Divise per Entrate/Uscite, ordinate per causale alfabetica
   */
  exportFinanceReport: (transactions: Transaction[]) => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('it-IT');
    
    // Intestazione
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Finanziario', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generato il ${today}`, 14, 28);
    
    // Calcoli totali
    const entrate = transactions.filter(t => t.type === 'Entrata');
    const uscite = transactions.filter(t => t.type === 'Uscita');
    
    const totaleEntrate = entrate.reduce((sum, t) => sum + t.amount, 0);
    const totaleUscite = uscite.reduce((sum, t) => sum + t.amount, 0);
    
    doc.text(`Totale Entrate: €${totaleEntrate}`, 14, 38);
    doc.text(`Totale Uscite: €${totaleUscite}`, 14, 45);
    doc.text(`Bilancio: €${totaleEntrate - totaleUscite}`, 14, 52);
    
    let yPos = 62;
    
    // ENTRATE (ordine alfabetico per descrizione)
    if (entrate.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ENTRATE', 14, yPos);
      
      const entrateOrdinate = [...entrate].sort((a, b) => a.desc.localeCompare(b.desc));
      
      autoTable(doc, {
        head: [['Data', 'Causale', 'Specie', 'Importo (€)']],
        body: entrateOrdinate.map(t => [
          t.date,
          t.desc,
          t.species,
          t.amount.toFixed(2)
        ]),
        startY: yPos + 5,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [4, 120, 87] },
        columnStyles: { 3: { halign: 'right' } }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // USCITE (ordine alfabetico per descrizione)
    if (uscite.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('USCITE', 14, yPos);
      
      const usciteOrdinate = [...uscite].sort((a, b) => a.desc.localeCompare(b.desc));
      
      autoTable(doc, {
        head: [['Data', 'Causale', 'Specie', 'Importo (€)']],
        body: usciteOrdinate.map(t => [
          t.date,
          t.desc,
          t.species,
          t.amount.toFixed(2)
        ]),
        startY: yPos + 5,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 38, 38] },
        columnStyles: { 3: { halign: 'right' } }
      });
    }
    
    doc.save(`bilancio_${today.replace(/\//g, '-')}.pdf`);
  },

  /**
   * Esporta i prodotti in magazzino in PDF
   * Ordine alfabetico per nome prodotto
   */
  exportProductsReport: (products: Product[]) => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('it-IT');
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Magazzino', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generato il ${today}`, 14, 28);
    doc.text(`Totale prodotti: ${products.length}`, 14, 35);
    
    // Ordine alfabetico per nome
    const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));
    
    autoTable(doc, {
      head: [['Prodotto', 'Quantità', 'Unità']],
      body: sorted.map(p => [
        p.name,
        p.quantity.toString(),
        p.unit
      ]),
      startY: 45,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [4, 120, 87] }
    });
    
    doc.save(`magazzino_${today.replace(/\//g, '-')}.pdf`);
  },

  /**
   * Esporta i task/agenda in PDF
   * Ordine per data (più recenti prima)
   */
  exportTasksReport: (tasks: Task[]) => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('it-IT');
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Agenda', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generato il ${today}`, 14, 28);
    
    const tasksDaFare = tasks.filter(t => !t.done);
    const tasksCompletate = tasks.filter(t => t.done);
    
    doc.text(`Task da fare: ${tasksDaFare.length}`, 14, 38);
    doc.text(`Task completate: ${tasksCompletate.length}`, 14, 45);
    
    let yPos = 55;
    
    // Task da fare (ordinate per data)
    if (tasksDaFare.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DA FARE', 14, yPos);
      
      const ordinate = [...tasksDaFare].sort((a, b) => 
        (a.dueDate || '').localeCompare(b.dueDate || '')
      );
      
      autoTable(doc, {
        head: [['Task', 'Scadenza']],
        body: ordinate.map(t => [
          t.text,
          t.dueDate ? new Date(t.dueDate).toLocaleDateString('it-IT') : '-'
        ]),
        startY: yPos + 5,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [4, 120, 87] }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Task completate
    if (tasksCompletate.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPLETATE', 14, yPos);
      
      autoTable(doc, {
        head: [['Task', 'Scadenza']],
        body: tasksCompletate.map(t => [
          t.text,
          t.dueDate ? new Date(t.dueDate).toLocaleDateString('it-IT') : '-'
        ]),
        startY: yPos + 5,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [100, 100, 100] }
      });
    }
    
    doc.save(`agenda_${today.replace(/\//g, '-')}.pdf`);
  },

  /**
   * Esporta i trattamenti sanitari in PDF
   * Ordinati per animale (specie > microchip)
   */
  exportTreatmentsReport: (animals: Animal[]) => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('it-IT');
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Trattamenti Sanitari', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generato il ${today}`, 14, 28);
    
    // Filtra animali con trattamenti
    const animaliConTrattamenti = animals.filter(a => a.treatments && a.treatments.length > 0);
    
    if (animaliConTrattamenti.length === 0) {
      doc.text('Nessun trattamento registrato', 14, 40);
      doc.save(`trattamenti_${today.replace(/\//g, '-')}.pdf`);
      return;
    }
    
    // Ordina per specie, poi per microchip
    const sorted = [...animaliConTrattamenti].sort((a, b) => {
      if (a.species !== b.species) return a.species.localeCompare(b.species);
      return a.microchip.localeCompare(b.microchip);
    });
    
    let yPos = 40;
    
    for (const animale of sorted) {
      // Controlla se abbiamo spazio per una nuova sezione
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${animale.species} - ${animale.microchip} ${animale.nome ? `(${animale.nome})` : ''}`, 14, yPos);
      
      if (animale.treatments && animale.treatments.length > 0) {
        autoTable(doc, {
          head: [['Data', 'Tipo', 'Scadenza', 'Completato', 'Note']],
          body: animale.treatments.map(t => [
            new Date(t.dataSomministrazione).toLocaleDateString('it-IT'),
            t.tipo,
            t.dataScadenza ? new Date(t.dataScadenza).toLocaleDateString('it-IT') : '-',
            t.completed ? '✓' : '✗',
            t.note || '-'
          ]),
          startY: yPos + 5,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [4, 120, 87] }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        yPos += 10;
      }
    }
    
    doc.save(`trattamenti_${today.replace(/\//g, '-')}.pdf`);
  }
};
