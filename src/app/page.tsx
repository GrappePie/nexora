import type { NextPage } from 'next';
import type { Metadata } from 'next';
import { FaShieldAlt, FaServer, FaMobileAlt, FaWifi, FaFileAlt, FaCheckSquare, FaCommentDots, FaLayerGroup, FaBox } from 'react-icons/fa';

// Metadatos de la página para el App Router de Next.js
export const metadata: Metadata = {
  title: 'Nexora - POS para Talleres Automotrices',
  description: 'Nexora combina un POS especializado para talleres con un portal de suscripciones, despliegue on‑prem con Docker, modo offline y más.',
};

// Componente para íconos de características
const FeatureIcon = ({ children }: { children: React.ReactNode }) => (
    <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
      {children}
    </div>
);

// Componente para tarjetas de características
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex items-start space-x-4">
      {icon}
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-1 text-gray-400">{description}</p>
      </div>
    </div>
);

// Componente para tarjetas de precios
const PricingCard = ({ plan, price, popular, features, buttonText }: { plan: string, price: string, popular?: boolean, features: string[], buttonText: string }) => (
    <div className={`p-6 rounded-lg border ${popular ? 'border-blue-500 bg-gray-800/50' : 'border-gray-700'} flex flex-col`}>
      {popular && <span className="text-xs font-bold text-blue-400 bg-blue-900/50 px-3 py-1 rounded-full self-start mb-4">Popular</span>}
      <h3 className="text-2xl font-bold">{plan}</h3>
      <p className="mt-2 text-4xl font-extrabold">{price}</p>
      <ul className="mt-6 space-y-4 text-gray-400 flex-grow">
        {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <FaCheckSquare className="w-5 h-5 text-green-400 mr-3" />
              <span>{feature}</span>
            </li>
        ))}
      </ul>
      <button className={`mt-8 w-full py-3 font-semibold rounded-lg transition-transform hover:scale-105 ${popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}>
        {buttonText}
      </button>
    </div>
);

const Home: NextPage = () => {
  return (
      <div className="bg-gray-900 text-white min-h-screen font-sans">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-wider">NEXORA</h1>
            <nav className="hidden md:flex items-center space-x-8 text-sm">
              <a href="#features" className="text-gray-300 hover:text-white transition">Características</a>
              <a href="#product" className="text-gray-300 hover:text-white transition">Producto</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition">Precios</a>
              <a href="#stack" className="text-gray-300 hover:text-white transition">Stack</a>
              <a href="/docs" className="text-gray-300 hover:text-white transition">Docs</a>
            </nav>
            <button className="px-5 py-2 text-sm font-semibold bg-white text-gray-900 rounded-md hover:bg-gray-200 transition">
              Ir al Portal
            </button>
          </div>
        </header>

        <main className="pt-24">
          {/* Hero Section */}
          <section className="text-center py-20 md:py-28">
            <div className="container mx-auto px-6">
              <div className="mb-4 text-sm font-semibold text-gray-400 tracking-wider">
                Multiproducto • Modular • LAN‑first
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                POS para talleres automotrices <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                con experiencia de nivel empresarial
              </span>
              </h2>
              <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-400">
                Nexora combina un POS especializado para talleres con un portal de suscripciones, despliegue on‑prem con Docker, modo offline con días de gracia y rutas públicas de aprobación.
              </p>
              <div className="mt-10 flex justify-center items-center space-x-4">
                <button className="px-8 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg shadow-blue-600/20">
                  Empezar ahora
                </button>
                <a href="/docs">
                  <button className="px-8 py-3 font-bold text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
                    Ver documentación
                  </button>
                </a>
              </div>
            </div>
          </section>

          {/* Product Section */}
          <section id="product" className="py-20">
            <div className="container mx-auto px-6">
              <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 md:flex md:space-x-10 items-center">
                <div className="md:w-1/2">
                  <h3 className="text-sm font-bold tracking-widest text-blue-400 uppercase">Producto Actual</h3>
                  <h4 className="text-3xl font-bold mt-2">Nexora POS Taller</h4>
                  <p className="mt-4 text-gray-400">
                    Ordenes de trabajo, piezas y mano de obra, cotizaciones, aprobación por enlace público y entrega de comprobantes por WhatsApp. Pensado para operar en LAN y seguir funcionando cuando Internet falla.
                  </p>
                  <ul className="mt-6 space-y-3 text-gray-300">
                    <li className="flex items-center"><FaCheckSquare className="w-5 h-5 text-green-400 mr-3" />Despliegue on‑prem con Docker Compose</li>
                    <li className="flex items-center"><FaCheckSquare className="w-5 h-5 text-green-400 mr-3" />PWA lista para dispositivos en LAN</li>
                    <li className="flex items-center"><FaCheckSquare className="w-5 h-5 text-green-400 mr-3" />Rutas públicas de aprobación (Cloudflare Tunnel)</li>
                    <li className="flex items-center"><FaCheckSquare className="w-5 h-5 text-green-400 mr-3" />Integración CFDI (sandbox → producción)</li>
                  </ul>
                  <div className="mt-8 flex space-x-4">
                    <button className="px-6 py-2 font-semibold bg-gray-700 rounded-lg hover:bg-gray-600">Probar en mi host</button>
                    <button className="px-6 py-2 font-semibold bg-transparent border border-gray-600 rounded-lg hover:bg-gray-800">Leer guía</button>
                  </div>
                </div>
                <div className="md:w-1/2 mt-10 md:mt-0 grid grid-cols-2 gap-4">
                  {["Orden de trabajo", "Inventario", "Cotizaciones", "Aprobaciones", "Clientes", "Reportes"].map(item => (
                      <div key={item} className="bg-gray-900/70 p-4 rounded-lg border border-gray-700/80 text-center">
                        <p className="font-semibold">{item}</p>
                        <a href="#" className="text-sm text-blue-400 hover:underline">Demo UI</a>
                      </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-20">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Construido para el mundo real</h2>
                <p className="mt-4 text-gray-400 max-w-2xl mx-auto">Operación en LAN, aprobaciones públicas y timbrado (sandbox primero). Todo en un stack moderno y modular.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <FeatureCard icon={<FeatureIcon><FaServer className="w-6 h-6 text-blue-400" /></FeatureIcon>} title="POS Taller Automotriz" description="Punto de venta diseñado para talleres: órdenes de trabajo, piezas y mano de obra, recibos y seguimiento." />
                <FeatureCard icon={<FeatureIcon><FaBox className="w-6 h-6 text-green-400" /></FeatureIcon>} title="On‑prem con Docker Compose" description="Se despliega en tu PC/servidor Ubuntu. Control total y latencia mínima en LAN." />
                <FeatureCard icon={<FeatureIcon><FaMobileAlt className="w-6 h-6 text-purple-400" /></FeatureIcon>} title="PWA + Portal" description="Frontend PWA con portal para gestionar planes, instalación y dispositivos cliente por QR." />
                <FeatureCard icon={<FeatureIcon><FaWifi className="w-6 h-6 text-yellow-400" /></FeatureIcon>} title="Modo offline" description="Opera sin Internet por periodos definidos; al expirar, entra en modo limitado hasta revalidar." />
                <FeatureCard icon={<FeatureIcon><FaFileAlt className="w-6 h-6 text-red-400" /></FeatureIcon>} title="CFDI: sandbox primero" description="Flujo PAC inicia en sandbox; producción se habilita después. Timbrado integrado a futuro." />
                <FeatureCard icon={<FeatureIcon><FaCheckSquare className="w-6 h-6 text-indigo-400" /></FeatureIcon>} title="Aprobaciones públicas" description="Ruta pública expuesta por Cloudflare Tunnel para aprobar cotizaciones/trabajos." />
                <FeatureCard icon={<FeatureIcon><FaCommentDots className="w-6 h-6 text-teal-400" /></FeatureIcon>} title="Compartir por WhatsApp" description="Compartir comprobantes por WhatsApp (gratis). SMTP opcional para correo." />
                <FeatureCard icon={<FeatureIcon><FaLayerGroup className="w-6 h-6 text-pink-400" /></FeatureIcon>} title="Stack moderno" description="Next.js + FastAPI + PostgreSQL + Redis + MinIO. Modular, escalable y auditable." />
              </div>
            </div>
          </section>

          {/* Stack/Architecture Section */}
          <section id="stack" className="py-20 bg-gray-900/70">
            <div className="container mx-auto px-6 text-center">
              <h2 className="text-3xl md:text-4xl font-bold">Arquitectura y Stack Modular</h2>
              <p className="mt-4 text-gray-400 max-w-3xl mx-auto">
                Frontend Next.js (PWA) + API en FastAPI con PostgreSQL, Redis y MinIO. Envío por WhatsApp gratis; SMTP opcional. Rutas públicas de aprobación detrás de Cloudflare Tunnel.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
                {['Next.js (App Router)', 'FastAPI', 'PostgreSQL', 'Redis / MinIO', 'On‑prem (Docker)', 'LAN‑first', 'WhatsApp/SMTP', 'CFDI sandbox', 'Aprobaciones', 'QR devices'].map(tech => (
                    <span key={tech} className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full border border-gray-700">{tech}</span>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="py-20">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Planes simples</h2>
                <p className="mt-4 text-gray-400 max-w-xl mx-auto">Precios por suscripción con módulos y asientos. Escala cuando lo necesites.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <PricingCard plan="Starter" price="$" features={['POS Taller básico', '1 host on‑prem', 'Hasta 2 asientos', 'Compartir por WhatsApp', 'Aprobaciones públicas']} buttonText="Comenzar" />
                <PricingCard plan="Pro" price="$$" popular={true} features={['Todo en Starter', 'Hasta 5 asientos', 'Módulos adicionales', 'Modo offline extendido', 'Soporte prioritario']} buttonText="Probar Pro" />
                <PricingCard plan="Enterprise" price="Custom" features={['Multi‑sede', 'Integraciones avanzadas', 'SLA y soporte dedicado', 'Cumplimiento y auditoría', 'Despliegues asistidos']} buttonText="Hablar con ventas" />
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20">
            <div className="container mx-auto px-6 text-center">
              <h2 className="text-3xl md:text-4xl font-bold">Listo para modernizar tu taller</h2>
              <p className="mt-4 text-gray-400 max-w-xl mx-auto">
                Despliega en tu host con Docker, comparte por WhatsApp y cobra con confianza incluso cuando falle Internet.
              </p>
              <div className="mt-8 flex justify-center items-center space-x-4">
                <button className="px-8 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg shadow-blue-600/20">
                  Crear mi espacio
                </button>
                <button className="px-8 py-3 font-bold text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
                  Guía de despliegue
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm">
              <p className="text-gray-400">&copy; {new Date().getFullYear()} Nexora</p>
              <div className="flex mt-4 md:mt-0 space-x-6">
                <a href="#" className="text-gray-400 hover:text-white">Privacidad</a>
                <a href="#" className="text-gray-400 hover:text-white">Términos</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
};

export default Home;
