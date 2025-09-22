-- Agregar campo para textos personalizados a la tabla quotes
-- Este campo almacenará los textos personalizados de cada cotización en formato JSON

-- Agregar el campo custom_texts como JSONB para mejor performance en consultas
ALTER TABLE quotes 
ADD COLUMN custom_texts JSONB DEFAULT NULL;

-- Agregar comentario explicativo
COMMENT ON COLUMN quotes.custom_texts IS 'Textos personalizados para esta cotización específica (includes, payment, requirements, etc.) en formato JSON';

-- Crear índice para consultas eficientes en el campo JSON
CREATE INDEX IF NOT EXISTS idx_quotes_custom_texts 
ON quotes USING GIN (custom_texts) 
WHERE custom_texts IS NOT NULL;

-- Ejemplo de estructura JSON que se almacenará:
-- {
--   "includes_title": "INCLUYE",
--   "includes_content": "Show culinario con equipos...",
--   "payment_title": "FORMA DE PAGO", 
--   "payment_content": "Anticipo 50%...",
--   "requirements_title": "REQUERIMIENTOS DE INSTALACIÓN",
--   "requirements_content": "La instalación se realiza...",
--   "observations_title": "OBSERVACIONES",
--   "observations_content": "Para requerir el servicio...",
--   "company_phone": "3174421013",
--   "company_email": "comercial@sue-events.com",
--   "company_instagram": "@sueevents",
--   "signature_name": "PEGGY CERVANTES G.",
--   "use_custom_texts": true
-- }