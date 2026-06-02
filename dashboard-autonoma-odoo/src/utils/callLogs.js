// src/utils/callLogs.js

// Importamos el archivo XML como texto crudo usando ?raw (funcionalidad de Vite)
import santaIsabelXml from './Santa_Isabel.xml?raw';
import sanPedroXml from './San_Pedro.xml?raw';
import sanJoseXml from './San_Jose.xml?raw';

// Exportamos el contenido para usarlo en la App
export const XML_SANTA_ISABEL = santaIsabelXml;

// Dejamos preparados los espacios para las otras sedes (cuando tengas los archivos)
export const XML_SAN_JOSE = sanJoseXml;
export const XML_SAN_PEDRO = sanPedroXml;
