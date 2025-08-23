# Dominios y certificados SSL

Para separar los despliegues del sitio público y la aplicación transaccional, se utilizan dominios distintos:

- `www.ejemplo.com` → proyecto `landing/`
- `pos.ejemplo.com` → proyecto `pos/`

Cada subdominio debe contar con su propio certificado SSL (p. ej. Let's Encrypt). Se recomienda automatizar la renovación mediante herramientas como Certbot o los mecanismos provistos por la plataforma de hosting.
