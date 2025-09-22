-- Tabla para almacenar plantillas de cotización personalizables
CREATE TABLE IF NOT EXISTS quote_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL DEFAULT 'default',
    
    -- Sección "INCLUYE" configurable
    includes_title VARCHAR(100) NOT NULL DEFAULT 'INCLUYE',
    includes_content TEXT NOT NULL DEFAULT 'Show culinario con equipos profesionales y utensilios especializados
Ingredientes premium para degustación. Menú personalizado según preferencias del cliente.
Chef especializado con experiencia en eventos corporativos
Transporte de equipos y logística completa',
    
    -- Información adicional configurable
    payment_title VARCHAR(100) NOT NULL DEFAULT 'FORMA DE PAGO',
    payment_content TEXT NOT NULL DEFAULT 'Anticipo: 50% - tres (3) semanas antes, para reservar la fecha del evento.
Saldo: 50% - el primer día del evento
Cuenta de ahorros de Bancolombia No. 10743399787 - Peggy Cervantes - CC. 22.461.151
Elaboramos cuenta de cobro como documento para solicitar el pago del servicio.',
    
    requirements_title VARCHAR(100) NOT NULL DEFAULT 'REQUERIMIENTOS DE INSTALACIÓN PARA EQUIPOS',
    requirements_content TEXT NOT NULL DEFAULT 'La instalación se realiza dos horas antes de iniciar el evento.
Cada equipo de cocción debe estar conectado a un punto de 110v, por separado.
Para eventos en hoteles o centros de convenciones, el cliente nos debe suministrar el punto eléctrico del equipo dentro del área asignada para su mejor funcionamiento.
En el caso de algún daño eléctrico en el lugar del evento que ocasioné daños a nuestros equipos, o que su personal los conecten en puntos 220 v, el cliente debe pagar el arreglo de este.
Ninguno de los equipos se puede brandear o pegar algún adhesivo. Se puede adherir con cinta de enmascarar la etiqueta del logo de su empresa o del cliente.',
    
    observations_title VARCHAR(100) NOT NULL DEFAULT 'OBSERVACIONES',
    observations_content TEXT NOT NULL DEFAULT 'Para requerir el servicio por favor enviar una orden de compra que contenga el tipo de servicio, cantidad, fecha, lugar, horario del evento, y las fechas de pago.
Si en el lugar del evento (Centros de Convenciones, Hoteles, etc.) solicitan descorche por nuestros productos y/o servicios, el cliente debe realizar este pago.
La cantidad de servicios contratados, es independiente al número de personas que asisten a su evento
Los servicios acordados de esta oferta deben ser prestados durante el horario del evento, ya que al ser servicios personalizados no se realizaran devoluciones o disminuciones de las cantidades solicitadas inicialmente.',
    
    -- Información de la empresa
    company_phone VARCHAR(50) NOT NULL DEFAULT '3174421013',
    company_email VARCHAR(100) NOT NULL DEFAULT 'comercial@sue-events.com',
    company_instagram VARCHAR(50) NOT NULL DEFAULT '@sueevents',
    signature_name VARCHAR(100) NOT NULL DEFAULT 'PEGGY CERVANTES G.',
    
    -- Campos de auditoría
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertar plantilla por defecto con los valores actuales
INSERT INTO quote_templates (
    template_name, 
    is_default, 
    is_active
) VALUES (
    'Plantilla Predeterminada', 
    true, 
    true
) ON CONFLICT DO NOTHING;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_quote_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quote_templates_updated_at
    BEFORE UPDATE ON quote_templates
    FOR EACH ROW
    EXECUTE PROCEDURE update_quote_templates_updated_at();

-- Asegurar que solo una plantilla sea la predeterminada
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE quote_templates 
        SET is_default = false 
        WHERE id != NEW.id AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_default_template
    BEFORE INSERT OR UPDATE ON quote_templates
    FOR EACH ROW
    EXECUTE PROCEDURE ensure_single_default_template();

-- Políticas RLS (solo para desarrollo, en producción usar roles apropiados)
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations during development" 
ON quote_templates FOR ALL 
USING (true) 
WITH CHECK (true);

-- Comentario de tabla
COMMENT ON TABLE quote_templates IS 'Almacena plantillas personalizables para las cotizaciones PDF';