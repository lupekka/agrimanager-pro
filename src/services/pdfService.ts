import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Animal } from '../types';

export const pdfService = {
  /**
   * Esporta il registro ASL in PDF
   */
  exportASLReport: (animals: Animal[], farmName?: string) => {
    const doc = new jsPDF();
    const farm = farmName || window.prompt("Nome Azienda:") || "Azienda Agricola";
    
    // Intestazione
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(farm, 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Registro di stalla - ${new Date().toLocaleDateString('it-IT')}`, 14, 28);
    
    // Ordina animali per specie
    const sorted = [...animals].sort((a, b) => a.species.localeCompare(b.species));
    
    // Crea tabella
    autoTable(doc, {
      head: [['Microchip', 'Nome', 'Specie', 'Data Nascita', 'Padre', 'Madre', 'Note', 'Trattamenti']],
      body: sorted.map(a => [
        a.microchip,  // ← CAMBIATO
        a.nome || '-',
        a.species,
        a.birthDate ? new Date(a.birthDate).toLocaleDateString('it-IT') : '',
        a.sire || '',
        a.dam || '',
        a.notes || '',
        a.treatments?.map(t => `${t.tipo} (${new Date(t.dataSomministrazione).toLocaleDateString('it-IT')})`).join(', ') || ''
      ]),
      startY: 35,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [4, 120, 87],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 240],
      },
    });
    
    doc.save('Registro_Stalla.pdf');
  },

  /**
   * Esporta report trattamenti in scadenza
   */
  exportExpiringTreatments: (expiringTreatments: any[], animals: Animal[]) => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Trattamenti in Scadenza', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, 14, 28);
    
    const tableData = expiringTreatments.map(t => {
      const animal = animals.find(a => a.id === t.animalId);
      return [
        animal?.microchip || '',  // ← CAMBIATO
        animal?.species || '',
        t.treatment.tipo,
        new Date(t.treatment.dataSomministrazione).toLocaleDateString('it-IT'),
        t.treatment.dataScadenza ? new Date(t.treatment.dataScadenza).toLocaleDateString('it-IT') : '-',
        t.isExpired ? 'SCADUTO' : `Tra ${t.daysLeft} giorni`,
        t.treatment.note || ''
      ];
    });
    
    autoTable(doc, {
      head: [['Microchip', 'Specie', 'Trattamento', 'Data', 'Scadenza', 'Stato', 'Note']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: [255, 255, 255],
      },
    });
    
    doc.save('Trattamenti_Scadenza.pdf');
  },

  /**
   * Esporta report finanziario
   */
  exportFinanceReport: (transactions: any[], totalIncome: number, totalExpense: number) => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Finanziario', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, 14, 28);
    
    // Riepilogo
    doc.setFontSize(12);
    doc.text('Riepilogo:', 14, 40);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Entrate totali: €${totalIncome}`, 20, 50);
    doc.text(`Uscite totali: €${totalExpense}`, 20, 58);
    doc.text(`Bilancio netto: €${totalIncome - totalExpense}`, 20, 66);
    
    // Tabella transazioni
    autoTable(doc, {
      head: [['Data', 'Descrizione', 'Specie', 'Tipo', 'Importo']],
      body: transactions.map(t => [
        t.date,
        t.desc,
        t.species,
        t.type,
        `€${t.amount}`
      ]),
      startY: 80,
      styles: { fontSize: 8 },
      headStyles: {
        fillColor: [4, 120, 87],
      },
      columnStyles: {
        4: { halign: 'right' }
      }
    });
    
    doc.save('Report_Finanziario.pdf');
  },

  /**
   * Esporta inventario prodotti
   */
  exportInventoryReport: (products: any[]) => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Inventario', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, 14, 28);
    
    autoTable(doc, {
      head: [['Prodotto', 'Quantità', 'Unità']],
      body: products.map(p => [p.name, p.quantity.toString(), p.unit]),
      startY: 35,
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [4, 120, 87],
      },
    });
    
    doc.save('Report_Inventario.pdf');
  },

  /**
   * Esporta report completo azienda
   */
  exportFullReport: (animals: Animal[], transactions: any[], products: any[], tasks: any[]) => {
    const doc = new jsPDF();
    
    // Frontespizio
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('AgriManager Pro', 105, 40, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('Report Aziendale Completo', 105, 60, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, 105, 80, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Totale animali: ${animals.length}`, 105, 100, { align: 'center' });
    doc.text(`Totale transazioni: ${transactions.length}`, 105, 110, { align: 'center' });
    doc.text(`Prodotti in magazzino: ${products.length}`, 105, 120, { align: 'center' });
    doc.text(`Task attivi: ${tasks.filter(t => !t.done).length}`, 105, 130, { align: 'center' });
    
    doc.addPage();
    
    // Animali
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Registro Animali', 14, 20);
    
    autoTable(doc, {
      head: [['Microchip', 'Specie', 'Data Nascita', 'Trattamenti']],
      body: animals.map(a => [
        a.microchip,  // ← CAMBIATO
        a.species,
        a.birthDate || '-',
        (a.treatments?.length || 0).toString()
      ]),
      startY: 30,
      styles: { fontSize: 8 },
    });
    
    doc.addPage();
    
    // Transazioni
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Transazioni', 14, 20);
    
    autoTable(doc, {
      head: [['Data', 'Descrizione', 'Tipo', 'Importo']],
      body: transactions.map(t => [
        t.date,
        t.desc,
        t.type,
        `€${t.amount}`
      ]),
      startY: 30,
      styles: { fontSize: 8 },
    });
    
    doc.save('Report_Completo.pdf');
  }
};
