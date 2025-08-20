import type { NextPage } from 'next';
import type { Metadata } from 'next';
import { FaServer, FaMobileAlt, FaWifi, FaFileAlt, FaCheckSquare, FaCommentDots, FaLayerGroup, FaBox, FaBars } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter as DialogFooterUI, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SearchHero } from '@/components/search-hero';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Metadatos de la página para el App Router de Next.js
export const metadata: Metadata = {
  title: 'Nexora - POS para Talleres Automotrices',
  description: 'Nexora combina un POS especializado para talleres con un portal de suscripciones, despliegue on‑prem con Docker, modo offline (roadmap) y más.',
};

// Componente para íconos de características
const FeatureIcon = ({ children }: { children: React.ReactNode }) => (
    <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
      {children}
    </div>
);

// Componente para tarjetas de características
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <Card className="bg-gray-900/70 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {icon}
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="mt-1 text-gray-400">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
);

// Componente para tarjetas de precios
const PricingCard = ({ plan, price, popular, features, buttonText }: { plan: string, price: string, popular?: boolean, features: string[], buttonText: string }) => (
    <Card className={`${popular ? 'border-blue-500 bg-gray-800/50' : ''} flex flex-col`}>
      <CardHeader>
        {popular && <Badge className="self-start">Popular</Badge>}
        <CardTitle>{plan}</CardTitle>
        <p className="mt-2 text-4xl font-extrabold">{price}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-4 text-gray-400">
          {features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <FaCheckSquare className="w-5 h-5 text-green-400 mr-3" />
                <span>{feature}</span>
              </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant={popular ? 'default' : 'secondary'}>
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
);

const Home: NextPage = () => {
  return (
      <div className="bg-gray-900 text-white min-h-screen font-sans">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-wider">NEXORA</h1>
            <nav className="hidden md:flex items-center space-x-8 text-sm">
              <Button asChild variant="link" className="text-gray-300 hover:text-white">
                <a href="#features">Características</a>
              </Button>
              <Button asChild variant="link" className="text-gray-300 hover:text-white">
                <a href="#product">Producto</a>
              </Button>
              <Button asChild variant="link" className="text-gray-300 hover:text-white">
                <a href="#pricing">Precios</a>
              </Button>
              <Button asChild variant="link" className="text-gray-300 hover:text-white">
                <a href="#stack">Stack</a>
              </Button>
              <Button asChild variant="link" className="text-gray-300 hover:text-white">
                <a href="/docs">Docs</a>
              </Button>
            </nav>
            <div className="flex items-center gap-2">
              <Button size="sm" className="hidden md:inline-flex bg-white text-gray-900 hover:bg-gray-200">
                Ir al Portal
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="sm" variant="secondary" className="md:hidden" aria-label="Abrir menú">
                    <FaBars className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-gray-900 border-gray-800 text-white">
                  <div className="p-6 space-y-4">
                    <SheetTitle>NEXORA</SheetTitle>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <Button asChild variant="link" className="justify-start">
                        <a href="#features">Características</a>
                      </Button>
                      <Button asChild variant="link" className="justify-start">
                        <a href="#product">Producto</a>
                      </Button>
                      <Button asChild variant="link" className="justify-start">
                        <a href="#pricing">Precios</a>
                      </Button>
                      <Button asChild variant="link" className="justify-start">
                        <a href="#stack">Stack</a>
                      </Button>
                      <Button asChild variant="link" className="justify-start">
                        <a href="/docs">Docs</a>
                      </Button>
                    </div>
                    <Separator />
                    <Button className="w-full">Ir al Portal</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
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
                Nexora combina un POS especializado para talleres con un portal de suscripciones, despliegue on‑prem con Docker, modo offline con días de gracia (roadmap) y rutas públicas de aprobación.
              </p>
              <div className="mt-10 flex justify-center items-center space-x-4">
                <Button size="lg">
                  Empezar ahora
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <a href="/docs">Ver documentación</a>
                </Button>
              </div>
              <SearchHero />
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary">Probar en mi host</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Probar en mi host</DialogTitle>
                          <DialogDescription>
                            Sigue la guía para levantar Nexora en tu máquina usando Docker Compose.
                          </DialogDescription>
                        </DialogHeader>
                        <p className="text-sm text-gray-300">Requisitos: Docker + Docker Compose, 2 GB RAM libres. Ambiente Ubuntu recomendado.</p>
                        <DialogFooterUI>
                          <Button asChild variant="link">
                            <a href="/docs/INSTALL">Ver instalación</a>
                          </Button>
                          <Button asChild>
                            <a href="/docs/OPERATIONS">Operación</a>
                          </Button>
                        </DialogFooterUI>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline">Leer guía</Button>
                  </div>
                  <div className="mt-8">
                    <Tabs defaultValue="vision">
                      <TabsList>
                        <TabsTrigger value="vision">Visión</TabsTrigger>
                        <TabsTrigger value="modulos">Módulos</TabsTrigger>
                        <TabsTrigger value="infra">Infra</TabsTrigger>
                      </TabsList>
                      <TabsContent value="vision">
                        <p>POS especializado para talleres, con foco LAN‑first, operación offline y aprobaciones públicas.</p>
                      </TabsContent>
                      <TabsContent value="modulos">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Órdenes de trabajo</li>
                          <li>Inventario y cotizaciones</li>
                          <li>Aprobaciones y clientes</li>
                        </ul>
                      </TabsContent>
                      <TabsContent value="infra">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Docker Compose on‑prem</li>
                          <li>PostgreSQL, Redis, MinIO</li>
                          <li>CFDI sandbox → prod</li>
                        </ul>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
                <div className="md:w-1/2 mt-10 md:mt-0 grid grid-cols-2 gap-4">
                  {["Orden de trabajo", "Inventario", "Cotizaciones", "Aprobaciones", "Clientes", "Reportes"].map(item => (
                      <Card key={item} className="bg-gray-900/70 border-gray-700/80 text-center">
                        <CardContent className="p-4">
                          <p className="font-semibold">{item}</p>
                            <Button asChild variant="link" className="text-blue-400 hover:text-blue-300 p-0 h-auto">
                              <a href="#">Demo UI</a>
                            </Button>
                        </CardContent>
                      </Card>
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
                <FeatureCard icon={<FeatureIcon><FaLayerGroup className="w-6 h-6 text-pink-400" /></FeatureIcon>} title="Stack moderno" description="Next.js hoy; FastAPI + PostgreSQL + Redis + MinIO (roadmap). Modular y escalable." />
              </div>
            </div>
          </section>

          {/* Stack/Architecture Section */}
          <section id="stack" className="py-20 bg-gray-900/70">
            <div className="container mx-auto px-6 text-center">
              <h2 className="text-3xl md:text-4xl font-bold">Arquitectura y Stack Modular</h2>
              <p className="mt-4 text-gray-400 max-w-3xl mx-auto">
                Hoy: Frontend Next.js. Plan: API en FastAPI con PostgreSQL, Redis y MinIO. Envío por WhatsApp gratis; SMTP opcional. Rutas públicas de aprobación detrás de Cloudflare Tunnel.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
                {['Next.js (App Router)', 'FastAPI', 'PostgreSQL', 'Redis / MinIO', 'On‑prem (Docker)', 'LAN‑first', 'WhatsApp/SMTP', 'CFDI sandbox', 'Aprobaciones', 'QR devices'].map(tech => (
                    <Badge key={tech} variant="outline" className="bg-gray-800/50 border-gray-700 text-gray-300">{tech}</Badge>
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
                <Button size="lg">
                  Crear mi espacio
                </Button>
                <Button variant="secondary" size="lg">
                  Guía de despliegue
                </Button>
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
                <Button asChild variant="link" className="text-gray-400 hover:text-white">
                  <a href="#">Privacidad</a>
                </Button>
                <Button asChild variant="link" className="text-gray-400 hover:text-white">
                  <a href="#">Términos</a>
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
};

export default Home;
