from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone

# ==================== AUTH MODELS ====================
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    organizacion_nombre: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    organizacion_id: Optional[str] = None
    organizaciones_ids: List[str] = []
    roles: List[dict] = []  # [{"organizacion_id": "x", "role": "admin"}]
    created_at: datetime

# ==================== ORGANIZACION MODELS ====================
class Organizacion(BaseModel):
    organizacion_id: str
    nombre: str
    rfc: Optional[str] = None
    rubro: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None

class OrganizacionCreate(BaseModel):
    nombre: str
    rfc: Optional[str] = None
    rubro: Optional[str] = "asistencial"
    direccion: Optional[str] = ""
    telefono: Optional[str] = ""
    email: Optional[str] = ""

# ==================== DONANTE MODELS ====================
class DonanteBase(BaseModel):
    nombre: str
    rfc: str
    tipo_persona: str = "moral"
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    pais: Optional[str] = "México"
    es_extranjero: bool = False

class DonanteCreate(DonanteBase):
    pass

class Donante(DonanteBase):
    donante_id: str
    organizacion_id: str
    total_donativos: float = 0
    cantidad_donativos: int = 0
    fecha_registro: str

# ==================== DONATIVO MODELS ====================
class DonativoBase(BaseModel):
    donante_id: str
    monto: float
    moneda: str = "MXN"
    tipo_donativo: str = "efectivo"
    es_especie: bool = False
    descripcion_especie: Optional[str] = None
    fecha_donativo: Optional[str] = None
    comprobante_fiscal: bool = True
    notas: Optional[str] = None
    metodo_pago: Optional[str] = "transferencia"
    referencia_pago: Optional[str] = None

class DonativoCreate(DonativoBase):
    pass

class Donativo(DonativoBase):
    donativo_id: str
    organizacion_id: str
    created_at: str

# ==================== CFDI MODELS ====================
class CFDIBase(BaseModel):
    donativo_id: str
    donante_id: str
    monto: float
    concepto: Optional[str] = "Donativo"
    uso_cfdi: str = "D04"
    forma_pago: str = "03"
    moneda: str = "MXN"

class CFDICreate(CFDIBase):
    pass

class CFDI(CFDIBase):
    cfdi_id: str
    organizacion_id: str
    folio: str
    uuid_fiscal: Optional[str] = None
    estado: str = "borrador"
    fecha_emision: str
    fecha_timbrado: Optional[str] = None

# ==================== OBLIGACION MODELS ====================
class ObligacionFiscal(BaseModel):
    obligacion_id: str
    organizacion_id: str
    nombre: str
    descripcion: Optional[str] = None
    tipo: str
    frecuencia: str
    fecha_limite: datetime
    estado: str = "pendiente"
    notas: Optional[str] = None

class ObligacionCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    tipo: str = "declaracion"
    frecuencia: str = "mensual"
    fecha_limite: str
    estado: str = "pendiente"

# ==================== TRANSPARENCIA MODELS ====================
class InformeTransparencia(BaseModel):
    informe_id: str
    organizacion_id: str
    ejercicio_fiscal: int
    estado: str = "borrador"
    progreso_completitud: float = 0.0
    datos: dict = {}
    created_at: str

class InformeCreate(BaseModel):
    ejercicio_fiscal: int

class InformeUpdate(BaseModel):
    estado: Optional[str] = None
    datos: Optional[dict] = None
    progreso_completitud: Optional[float] = None

# ==================== DASHBOARD MODELS ====================
class DashboardStats(BaseModel):
    total_donantes: int
    total_donativos: float
    total_cfdis: int
    total_obligaciones_pendientes: int
    donativos_por_mes: list
    obligaciones_proximas: List[dict]

# ==================== AML ALERTS MODELS ====================
class AlertRule(BaseModel):
    rule_id: str
    organizacion_id: str
    nombre: str
    tipo_regla: str
    severidad: str = "media"
    condiciones: dict = {}
    activa: bool = True
    descripcion: Optional[str] = None
    created_at: str

class AlertRuleCreate(BaseModel):
    nombre: str
    tipo_regla: str
    severidad: str = "media"
    condiciones: dict = {}
    activa: bool = True
    descripcion: Optional[str] = None

class Alert(BaseModel):
    alert_id: str
    rule_id: Optional[str] = None
    organizacion_id: str
    donante_id: Optional[str] = None
    donativo_id: Optional[str] = None
    tipo: str
    severidad: str
    titulo: str
    descripcion: str
    estado: str = "nueva"
    datos_adicionales: dict = {}
    created_at: str
    resolved_at: Optional[str] = None

class AlertCreate(BaseModel):
    tipo: str
    severidad: str = "media"
    titulo: str
    descripcion: str
    donante_id: Optional[str] = None
    donativo_id: Optional[str] = None

# ==================== REPORTS MODELS ====================
class ReportTemplate(BaseModel):
    template_id: str
    organizacion_id: str
    nombre: str
    tipo_reporte: str
    destinatario: str
    descripcion: Optional[str] = None
    periodicidad: str = "mensual"
    criterios: dict = {}
    activa: bool = True
    created_at: str

class ReportTemplateCreate(BaseModel):
    nombre: str
    tipo_reporte: str
    destinatario: str = "UIF"
    descripcion: Optional[str] = None
    periodicidad: str = "mensual"
    criterios: dict = {}
    activa: bool = True

class Report(BaseModel):
    report_id: str
    organizacion_id: str
    template_id: Optional[str] = None
    titulo: str
    tipo: str
    destinatario: str
    descripcion: Optional[str] = None
    estado: str = "borrador"
    datos: dict = {}
    periodo_inicio: str
    periodo_fin: str
    created_at: str
    submitted_at: Optional[str] = None

class ReportCreate(BaseModel):
    titulo: str
    tipo: str
    destinatario: str = "UIF"
    descripcion: Optional[str] = None
    periodo_inicio: str
    periodo_fin: str
    template_id: Optional[str] = None
    criterios: dict = {}

# ==================== WORKFLOW MODELS ====================
class Workflow(BaseModel):
    workflow_id: str
    organizacion_id: str
    nombre: str
    descripcion: Optional[str] = None
    trigger_type: str
    condiciones: dict = {}
    acciones: List[dict] = []
    activo: bool = True
    created_at: str

class WorkflowCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    trigger_type: str
    condiciones: dict = {}
    acciones: List[dict] = []
    activo: bool = True

# ==================== ROLES MODELS ====================
class UserOrgRole(BaseModel):
    organizacion_id: str
    role: str  # "admin", "editor", "viewer"

class RoleAssignment(BaseModel):
    user_email: str
    role: str  # "admin", "editor", "viewer"
