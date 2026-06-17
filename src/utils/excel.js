import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename = 'relatorio_extintores.xlsx') => {
  // Format data for excel
  const formattedData = data.map(item => ({
    'ID': item.id,
    'Placa do Veículo': item.vehicle_plate,
    'Prefixo': item.prefix,
    'Número de Série': item.serial_number,
    'Data de Vencimento': new Date(item.expiration_date).toLocaleDateString('pt-BR'),
    'Status': item.is_full ? 'Cheio' : 'Vazio/Usado',
    'Cadastrado em': new Date(item.created_at).toLocaleDateString('pt-BR'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Extintores');
  
  // Create file and trigger download
  XLSX.writeFile(workbook, filename);
};
