import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename = 'relatorio_inspecoes.xlsx') => {
  // Format data for excel
  const formattedData = data.map(item => {
    const isPending = item.serial_number && item.serial_number.startsWith('PENDENTE-');
    return {
      'ID': item.id,
      'Placa do Veículo': item.vehicle_plate,
      'Prefixo': item.prefix,
      'Possui Extintor': isPending ? 'Pendente' : (item.has_extinguisher === false ? 'Não' : 'Sim'),
      'Número de Série': isPending ? 'Pendente' : (item.has_extinguisher === false ? 'N/A' : item.serial_number),
      'Data de Vencimento': isPending ? 'Pendente' : (item.has_extinguisher === false ? 'N/A' : new Date(item.expiration_date).toLocaleDateString('pt-BR')),
      'Status': isPending ? 'Pendente' : (item.has_extinguisher === false ? 'N/A' : (item.is_full ? 'Cheio' : 'Vazio/Usado')),
      'Selo Metroplan': isPending ? 'Pendente' : (item.has_metroplan_seal ? 'Sim' : 'Não'),
      'Cadastrado em': new Date(item.created_at).toLocaleDateString('pt-BR'),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inspeções');
  
  // Create file and trigger download
  XLSX.writeFile(workbook, filename);
};
