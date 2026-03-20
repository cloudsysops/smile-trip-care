# Dashboards por rol — Diseño y roadmap

Definición de los dashboards para **Admin**, **Especialistas**, **Pacientes/Clientes** y **Proveedores**, con estructura tipo panel (sidebar + overview + métricas + acciones), y qué más conviene tener en cuenta.

---

## 1. Resumen por rol

| Rol | Dashboard | Estado actual | Prioridad |
|-----|-----------|----------------|-----------|
| **Admin** | Panel de administración de la plataforma | Parcial: leads, assets, login. Falta overview, aprobaciones, métricas. | Ya existe base; mejorar. |
| **Especialista** | Panel del especialista (consultas, agenda, ingresos) | No existe. Requiere auth + rol o vínculo perfil ↔ especialista. | Alto. |
| **Paciente / Cliente** | Mi cuenta: leads, reservas, pagos, mensajes | No existe. Requiere auth y vincular lead(s) al perfil. | Alto. |
| **Proveedor** (clínica / tour operator) | Panel del proveedor (especialistas, paquetes, reservas) | No existe. Red curada = hoy todo lo hace admin; opcional después. | Medio (fase 2). |

---

## 2. Admin Dashboard

**Objetivo:** Gestionar la plataforma, la red curada y el funnel de ventas.

**Estructura sugerida (sidebar + contenido):**

- **Identidad:** Nombre del admin, email (desde `profiles` / Auth).
- **Navegación (sidebar):**
  - **Overview** — Resumen: leads nuevos, pendientes de aprobar, depósitos del mes, estado del sistema.
  - **Leads** — Lista y detalle (ya existe en `/admin/leads`, `/admin/leads/[id]`).
  - **Aprobaciones** — Proveedores y especialistas con `approval_status = 'pending'`; acciones Aprobar / Rechazar.
  - **Proveedores** — CRUD proveedores (hoy en Supabase; luego UI).
  - **Especialistas** — CRUD especialistas.
  - **Paquetes y experiencias** — Listado y edición (o enlace a Supabase si se prefiere).
  - **Assets** — Ya existe `/admin/assets`.
  - **Configuración** — Ajustes de plataforma, miembros (si aplica).
  - **Uso / Facturación** — Si hay suscripción o gastos de plataforma (Stripe, etc.).
  - **Docs / Soporte** — Enlaces a documentación interna o contacto.

**Métricas / KPIs (Overview):**

- Leads nuevos (hoy / esta semana).
- Pendientes de aprobación (proveedores + especialistas).
- Reservas con depósito pagado (bookings con status `deposit_paid`).
- Ingresos del mes (desde `payments`).
- Gráfico o heatmap de actividad (leads o reservas por día/semana), opcional.

**Acciones rápidas:**

- “Revisar leads nuevos”, “Aprobar proveedor”, “Enviar enlace de depósito”, etc.

**Estado actual:** Base hecha (leads, assets, login con `requireAdmin`). **Admin Overview implementado (métricas básicas):** `/admin` y `/admin/overview` con KPIs (leads hoy/semana, pendientes aprobación, reservas con depósito, ingresos del mes) y navegación a Leads y Assets. Falta: flujo de aprobaciones en UI, listados de proveedores/especialistas/paquetes.

---

## 3. Dashboard del especialista

**Objetivo:** Que el especialista vea sus consultas, agenda y (después) ingresos, sin crear ni aprobar proveedores (eso sigue siendo admin).

**Prerrequisitos:**

- Que el especialista tenga cuenta (Supabase Auth).
- Vínculo perfil ↔ especialista: p. ej. `profiles.specialist_id` (FK a `specialists.id`) o rol `profiles.role = 'specialist'` + tabla de enlace. Solo los especialistas aprobados y publicados deberían poder acceder.

**Estructura sugerida (sidebar + contenido):**

- **Identidad:** Nombre del especialista, clínica/proveedor (desde `specialists` + `providers`).
- **Navegación:**
  - **Overview** — Resumen: consultas esta semana, próximas citas, (más adelante) ingresos o paquetes en los que participa.
  - **Mis consultas** — Lista de `consultations` donde `specialist_id = yo`; estados: solicitada, agendada, realizada, cancelada.
  - **Agenda / Disponibilidad** — Calendario o lista de citas; más adelante, bloques de disponibilidad (fase 2).
  - **Pacientes / Leads** — Leads asociados a sus consultas (solo los que le corresponden).
  - **Mi perfil** — Datos públicos (nombre, especialidad, descripción) editables según política (solo admin o también especialista).
  - **Facturación / Ingresos** — Si aplica modelo de pagos a especialistas (fase 2).
  - **Ajustes** — Notificaciones, idioma, etc.
  - **Ayuda / Contacto** — Soporte interno.

**Métricas (Overview):**

- Consultas este mes / pendientes de agendar.
- Próxima cita.
- (Opcional) Tendencia de consultas (gráfico o heatmap tipo “actividad”).

**Acciones rápidas:**

- “Ver consultas pendientes”, “Confirmar cita”, “Actualizar disponibilidad”.

**Estado actual:** No existe. Requiere diseño de auth + vínculo perfil–especialista y rutas bajo algo como `/specialist/*` protegidas por “es especialista y aprobado”.

---

## 4. Dashboard del paciente / cliente

**Objetivo:** Que el paciente vea sus solicitudes (leads), reservas, pagos y, si aplica, mensajes o historial de consultas.

**Prerrequisitos:**

- Paciente con cuenta (Supabase Auth).
- Vincular lead(s) al perfil: p. ej. `leads.profile_id` (FK a `profiles.id`) al crear el lead (si viene logueado) o al “reclamar” un lead (email match o enlace mágico). Sin esto, no hay “mis reservas” por usuario.

**Estructura sugerida (sidebar + contenido):**

- **Identidad:** Nombre del paciente, email (desde `profiles` / Auth).
- **Navegación:**
  - **Overview** — Estado de mi solicitud/reserva: último lead, estado del booking, próximo paso (p. ej. “Pagar depósito”, “Completar formulario”).
  - **Mis solicitudes** — Lista de leads vinculados al perfil; ver detalle y estado.
  - **Mis reservas** — Bookings asociados: paquete, estado (pendiente, depósito pagado, completado), depósito.
  - **Pagos** — Historial de pagos (desde `payments` vía lead/booking).
  - **Mis consultas** — Si hay consultas asignadas al paciente (p. ej. por lead), listarlas con fecha y especialista.
  - **Mi perfil** — Datos personales, preferencias.
  - **Ajustes** — Notificaciones, idioma.
  - **Ayuda / Contacto** — WhatsApp, email soporte.

**Métricas (Overview):**

- Estado del booking actual (texto o badge).
- Próxima cita (si existe).
- (Opcional) Progreso del tratamiento o del paquete (pasos completados).

**Acciones rápidas:**

- “Pagar depósito”, “Ver mi reserva”, “Contactar soporte”.

**Estado actual:** No existe. Thank-you post-assessment muestra `lead_id`; no hay área “mi cuenta” ni vinculación lead ↔ perfil.

---

## 5. Dashboard del proveedor (clínica / tour operator)

**Objetivo:** Que un proveedor vea sus especialistas, paquetes, experiencias y reservas asociadas. En modelo de red curada, la creación/edición puede seguir siendo admin; el dashboard es sobre visibilidad y operación.

**Prerrequisitos:**

- Rol o vínculo: p. ej. `profiles.provider_id` (FK a `providers.id`) o rol `provider`.
- Solo proveedores aprobados (`approval_status = 'approved'`) deberían tener acceso.

**Estructura sugerida (sidebar + contenido):**

- **Identidad:** Nombre del proveedor, ciudad, tipo (clínica / tour operator).
- **Navegación:**
  - **Overview** — Reservas este mes, paquetes activos, especialistas, (opcional) ingresos.
  - **Especialistas** — Lista de especialistas con `provider_id = yo` (solo lectura o edición limitada según política).
  - **Paquetes** — Paquetes con `provider_id = yo`; estado publicado/borrador.
  - **Experiencias** — Experiencias del proveedor.
  - **Reservas** — Bookings donde `provider_id = yo`.
  - **Mi perfil** — Datos del proveedor (visibles/editables según política).
  - **Facturación** — Si hay pagos a proveedores (fase 2).
  - **Ajustes / Ayuda** — Igual que otros roles.

**Métricas (Overview):**

- Número de reservas (pendientes / con depósito).
- Paquetes publicados.
- (Opcional) Ingresos o comisiones.

**Estado actual:** No existe. Opcional en una fase 2 una vez establecidos Admin, Especialista y Paciente.

---

## 6. Qué más conviene tener (común o por rol)

- **Notificaciones / alertas:** Nuevos leads, reserva con depósito pagado, cita asignada, cambio de estado. Centro de notificaciones en el header o en cada dashboard.
- **Búsqueda y filtros:** Sobre todo en Admin (leads, proveedores, especialistas, reservas) y en Proveedor (reservas, paquetes). Filtros por fecha, estado, ciudad, etc.
- **Reportes y analíticas:** Admin: tendencias de leads, conversión, ingresos. Especialista: consultas por periodo. Proveedor: reservas por paquete. Exportar CSV/Excel (fase 2).
- **Comunicación:** Canal paciente ↔ especialista o paciente ↔ coordinación (mensajes en la plataforma o enlace a WhatsApp/email). No sustituir WhatsApp si ya es el canal principal; integrar o enlazar.
- **Progreso / hitos:** Paciente: “Pasos de tu viaje” (solicitud enviada, depósito pagado, cita agendada, etc.). Especialista: metas de consultas o ingresos (opcional).
- **Auditoría y seguridad:** Admin: registro de quién aprobó qué y cuándo (`approved_by`, timestamps). Logs de acciones sensibles (cambios de estado, pagos). Relevante para producción y compliance.
- **Onboarding / guía:** Primera vez que un especialista o proveedor entra al dashboard: tour o pasos (“Completa tu perfil”, “Revisa tus consultas pendientes”). Para paciente: “Así sigue tu proceso”.
- **Responsive y accesibilidad:** Los cuatro dashboards deben usarse bien en móvil (especialmente paciente y especialista) y cumplir buenas prácticas de accesibilidad (contraste, focus, labels).

---

## 7. Orden sugerido de implementación

1. **Admin (mejorar lo actual):** Overview con métricas, pantalla de aprobaciones (proveedores/especialistas pendientes), luego listados/CRUD de proveedores y especialistas en UI.
2. **Paciente:** Auth + vinculación lead ↔ perfil; dashboard mínimo: “Mis solicitudes” y “Mis reservas” + estado del booking y enlace a pagar depósito.
3. **Especialista:** Auth + vínculo perfil ↔ especialista; dashboard mínimo: “Mis consultas” y overview (próximas citas, pendientes).
4. **Proveedor:** Opcional; después de tener establecidos Admin, Paciente y Especialista.
5. **Extras:** Notificaciones, reportes y comunicación según prioridad de negocio.

---

## 8. Referencias

- **Modelo de datos y roles:** [DATA_MODEL.md](DATA_MODEL.md), [CURATED_NETWORK_FOUNDATION.md](CURATED_NETWORK_FOUNDATION.md).
- **Auth actual:** `lib/auth.ts` (`requireAdmin`, `getCurrentUser`). Extender con `requireSpecialist`, `requireProvider`, `requirePatient` según se implementen roles o vínculos.
- **Tareas de auditoría:** [TAREAS_AUDITORIA_BUENAS_PRACTICAS.md](TAREAS_AUDITORIA_BUENAS_PRACTICAS.md).

Inspiración de estructura (sidebar, overview, métricas, actividad): dashboards tipo Cursor/Stripe — perfil arriba, navegación a la izquierda, contenido principal con KPIs y acciones claras.
