// src/utils/callLogs.js

// Importamos el archivo XML como texto crudo usando ?raw (funcionalidad de Vite)
import victorLiraXml from './Victor_Lira.xml?raw';
import sanPedroXml from './San_Pedro.xml?raw';
import sanJoseXml from './San_Jose.xml?raw';

// Exportamos el contenido para usarlo en la App
export const XML_VICTOR_LIRA = victorLiraXml;

// Dejamos preparados los espacios para las otras sedes (cuando tengas los archivos)
export const XML_SAN_JOSE = sanJoseXml;
export const XML_SAN_PEDRO = sanPedroXml;
