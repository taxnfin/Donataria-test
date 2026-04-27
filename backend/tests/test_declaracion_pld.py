"""
Test suite for Declaracion Anual (Titulo III LISR) and PLD/AML modules
Iteration 10 - Testing new features:
- Declaracion Anual CRUD + auto-fill + 10% control + remanente ficto + PDF
- PLD/AML: operaciones vulnerables, avisos UIF, matriz riesgo, KYC, due diligence
"""

import pytest
import requests
import os
import time
from datetime import datetime

# BASE_URL imported from conftest

# Test credentials
from conftest import TEST_EMAIL, TEST_PASSWORD, BASE_URL


class TestAuth:
    """Authentication for subsequent tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        
        # Login
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return s
    
    def test_login_success(self, session):
        """Verify login works"""
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        print(f"✓ Logged in as {data['email']}")


class TestDeclaracionAnualCRUD:
    """Declaracion Anual CRUD operations"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return s
    
    @pytest.fixture(scope="class")
    def test_declaracion_id(self, session):
        """Create a test declaration and return its ID for other tests"""
        # First, clean up any existing test declaration for 2099
        existing = session.get(f"{BASE_URL}/api/declaraciones")
        if existing.status_code == 200:
            for dec in existing.json():
                if dec.get("ejercicio_fiscal") == 2099:
                    session.delete(f"{BASE_URL}/api/declaraciones/{dec['declaracion_id']}")
        
        # Create new test declaration
        response = session.post(f"{BASE_URL}/api/declaraciones", json={
            "ejercicio_fiscal": 2099,
            "ingresos_donativos_efectivo": 100000,
            "ingresos_donativos_especie": 50000,
            "ingresos_actividades_propias": 20000,
            "ingresos_actividades_no_relacionadas": 5000,  # Within 10% limit
            "deducciones_operacion": 30000,
            "deducciones_administracion": 10000,
        })
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "declaracion_id" in data
        yield data["declaracion_id"]
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/declaraciones/{data['declaracion_id']}")
    
    def test_list_declaraciones(self, session):
        """GET /api/declaraciones - list declarations"""
        response = session.get(f"{BASE_URL}/api/declaraciones")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} declaraciones")
    
    def test_create_declaracion(self, session):
        """POST /api/declaraciones - create declaration with fiscal data"""
        # Clean up first
        existing = session.get(f"{BASE_URL}/api/declaraciones")
        if existing.status_code == 200:
            for dec in existing.json():
                if dec.get("ejercicio_fiscal") == 2098:
                    session.delete(f"{BASE_URL}/api/declaraciones/{dec['declaracion_id']}")
        
        response = session.post(f"{BASE_URL}/api/declaraciones", json={
            "ejercicio_fiscal": 2098,
            "ingresos_donativos_efectivo": 500000,
            "ingresos_donativos_especie": 100000,
            "ingresos_cuotas_asociados": 50000,
            "ingresos_actividades_propias": 80000,
            "ingresos_actividades_no_relacionadas": 30000,
            "ingresos_intereses": 10000,
            "ingresos_otros": 5000,
            "deducciones_operacion": 200000,
            "deducciones_administracion": 100000,
            "deducciones_financieros": 5000,
            "deducciones_otros": 10000,
            "ficto_omision_ingresos": 0,
            "ficto_compras_no_realizadas": 0,
            "ficto_prestamos_socios": 0,
            "ficto_gastos_no_deducibles": 0,
            "notas": "TEST_declaracion_2098"
        })
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "declaracion_id" in data
        assert data["ejercicio_fiscal"] == 2098
        assert data["estado"] == "borrador"
        assert "calculos" in data
        
        # Verify calculations
        calc = data["calculos"]
        assert calc["total_ingresos"] == 775000  # Sum of all ingresos
        assert calc["total_deducciones"] == 315000  # Sum of all deducciones
        assert calc["remanente_distribuible"] == 460000  # ingresos - deducciones
        
        # Verify 10% control
        c10 = calc["control_10_porciento"]
        expected_pct = round(30000 / 775000 * 100, 2)
        assert c10["porcentaje_no_relacionadas"] == expected_pct
        assert c10["excede_limite"] == False  # 3.87% < 10%
        
        print(f"✓ Created declaracion {data['declaracion_id']} with correct calculations")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/declaraciones/{data['declaracion_id']}")
    
    def test_get_declaracion(self, session, test_declaracion_id):
        """GET /api/declaraciones/{id} - get declaration with calculated fields"""
        response = session.get(f"{BASE_URL}/api/declaraciones/{test_declaracion_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["declaracion_id"] == test_declaracion_id
        assert "calculos" in data
        assert "total_ingresos" in data["calculos"]
        assert "control_10_porciento" in data["calculos"]
        print(f"✓ Retrieved declaracion with calculated fields")
    
    def test_update_declaracion(self, session, test_declaracion_id):
        """PUT /api/declaraciones/{id} - update declaration"""
        response = session.put(f"{BASE_URL}/api/declaraciones/{test_declaracion_id}", json={
            "ingresos_donativos_efectivo": 150000,
            "notas": "TEST_updated_declaracion"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["ingresos_donativos_efectivo"] == 150000
        assert data["notas"] == "TEST_updated_declaracion"
        print(f"✓ Updated declaracion successfully")
    
    def test_auto_fill_declaracion(self, session):
        """GET /api/declaraciones/auto-fill/{ejercicio} - auto-fill from existing data"""
        response = session.get(f"{BASE_URL}/api/declaraciones/auto-fill/2026")
        assert response.status_code == 200
        data = response.json()
        
        assert "ejercicio_fiscal" in data
        assert data["ejercicio_fiscal"] == 2026
        assert "ingresos_donativos_efectivo" in data
        assert "ingresos_donativos_especie" in data
        print(f"✓ Auto-fill returned: efectivo={data['ingresos_donativos_efectivo']}, especie={data['ingresos_donativos_especie']}")
    
    def test_delete_declaracion(self, session):
        """DELETE /api/declaraciones/{id} - delete declaration"""
        # Create one to delete
        create_resp = session.post(f"{BASE_URL}/api/declaraciones", json={
            "ejercicio_fiscal": 2097,
            "ingresos_donativos_efectivo": 10000,
        })
        assert create_resp.status_code == 200
        dec_id = create_resp.json()["declaracion_id"]
        
        # Delete it
        response = session.delete(f"{BASE_URL}/api/declaraciones/{dec_id}")
        assert response.status_code == 200
        
        # Verify it's gone
        get_resp = session.get(f"{BASE_URL}/api/declaraciones/{dec_id}")
        assert get_resp.status_code == 404
        print(f"✓ Deleted declaracion successfully")


class TestDeclaracion10PercentControl:
    """Test the 10% control validation for actividades no relacionadas"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return s
    
    def test_presentar_within_10_percent(self, session):
        """POST /api/declaraciones/{id}/presentar - should succeed when within 10%"""
        # Clean up first
        existing = session.get(f"{BASE_URL}/api/declaraciones")
        if existing.status_code == 200:
            for dec in existing.json():
                if dec.get("ejercicio_fiscal") == 2096:
                    session.delete(f"{BASE_URL}/api/declaraciones/{dec['declaracion_id']}")
        
        # Create declaration within 10% limit
        create_resp = session.post(f"{BASE_URL}/api/declaraciones", json={
            "ejercicio_fiscal": 2096,
            "ingresos_donativos_efectivo": 100000,
            "ingresos_actividades_no_relacionadas": 5000,  # 5% of total
        })
        assert create_resp.status_code == 200
        dec_id = create_resp.json()["declaracion_id"]
        
        # Try to present it
        response = session.post(f"{BASE_URL}/api/declaraciones/{dec_id}/presentar")
        assert response.status_code == 200
        data = response.json()
        assert "presentada" in data.get("message", "").lower()
        
        # Verify state changed
        get_resp = session.get(f"{BASE_URL}/api/declaraciones/{dec_id}")
        assert get_resp.json()["estado"] == "presentada"
        
        print(f"✓ Presented declaracion within 10% limit")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/declaraciones/{dec_id}")
    
    def test_presentar_exceeds_10_percent(self, session):
        """POST /api/declaraciones/{id}/presentar - should fail when exceeds 10%"""
        # Clean up first
        existing = session.get(f"{BASE_URL}/api/declaraciones")
        if existing.status_code == 200:
            for dec in existing.json():
                if dec.get("ejercicio_fiscal") == 2095:
                    session.delete(f"{BASE_URL}/api/declaraciones/{dec['declaracion_id']}")
        
        # Create declaration exceeding 10% limit
        create_resp = session.post(f"{BASE_URL}/api/declaraciones", json={
            "ejercicio_fiscal": 2095,
            "ingresos_donativos_efectivo": 100000,
            "ingresos_actividades_no_relacionadas": 20000,  # 16.67% of total - exceeds 10%
        })
        assert create_resp.status_code == 200
        dec_id = create_resp.json()["declaracion_id"]
        
        # Verify calculation shows it exceeds
        get_resp = session.get(f"{BASE_URL}/api/declaraciones/{dec_id}")
        calc = get_resp.json()["calculos"]
        assert calc["control_10_porciento"]["excede_limite"] == True
        
        # Try to present it - should fail
        response = session.post(f"{BASE_URL}/api/declaraciones/{dec_id}/presentar")
        assert response.status_code == 400
        assert "10%" in response.json().get("detail", "")
        
        print(f"✓ Correctly rejected presentation when exceeding 10% limit")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/declaraciones/{dec_id}")


class TestDeclaracionPDF:
    """Test PDF generation for declarations"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return s
    
    def test_download_pdf(self, session):
        """GET /api/declaraciones/{id}/pdf - download PDF"""
        # Clean up and create
        existing = session.get(f"{BASE_URL}/api/declaraciones")
        if existing.status_code == 200:
            for dec in existing.json():
                if dec.get("ejercicio_fiscal") == 2094:
                    session.delete(f"{BASE_URL}/api/declaraciones/{dec['declaracion_id']}")
        
        create_resp = session.post(f"{BASE_URL}/api/declaraciones", json={
            "ejercicio_fiscal": 2094,
            "ingresos_donativos_efectivo": 100000,
            "deducciones_operacion": 30000,
        })
        assert create_resp.status_code == 200
        dec_id = create_resp.json()["declaracion_id"]
        
        # Download PDF
        response = session.get(f"{BASE_URL}/api/declaraciones/{dec_id}/pdf")
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 1000  # PDF should have some content
        
        print(f"✓ Downloaded PDF ({len(response.content)} bytes)")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/declaraciones/{dec_id}")


class TestPLDDashboard:
    """Test PLD/AML Dashboard"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return s
    
    def test_pld_dashboard(self, session):
        """GET /api/pld/dashboard - PLD dashboard stats"""
        response = session.get(f"{BASE_URL}/api/pld/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "alertas" in data
        assert "avisos_uif" in data
        assert "operaciones_vulnerables" in data
        assert "due_diligence" in data
        assert "kyc" in data
        assert "umbral_operacion_vulnerable_mxn" in data
        
        # Verify alertas structure
        alertas = data["alertas"]
        assert "total" in alertas
        assert "nuevas" in alertas
        assert "en_revision" in alertas
        assert "resueltas" in alertas
        assert "tasa_resolucion" in alertas
        
        # Verify KYC structure
        kyc = data["kyc"]
        assert "total_donantes" in kyc
        assert "kyc_completo" in kyc
        assert "kyc_porcentaje" in kyc
        
        print(f"✓ PLD Dashboard: {data['operaciones_vulnerables']} ops vulnerables, KYC {kyc['kyc_porcentaje']}%")


class TestOperacionesVulnerables:
    """Test operaciones vulnerables detection (Art. 17 Ley Antilavado)"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return s
    
    def test_get_operaciones_vulnerables(self, session):
        """GET /api/pld/operaciones-vulnerables - detect ops >= 1605 UMAs"""
        response = session.get(f"{BASE_URL}/api/pld/operaciones-vulnerables")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "umbral_umas" in data
        assert data["umbral_umas"] == 1605
        assert "umbral_mxn" in data
        assert "valor_uma_diario" in data
        assert "total_operaciones" in data
        assert "operaciones" in data
        
        # Verify each operation has required fields
        for op in data["operaciones"]:
            assert "donativo_id" in op
            assert "donante_id" in op
            assert "donante_nombre" in op
            assert "monto" in op
            assert "aviso_presentado" in op
            assert op["monto"] >= data["umbral_mxn"]
        
        print(f"✓ Found {data['total_operaciones']} operaciones vulnerables (umbral: ${data['umbral_mxn']:,.2f})")


class TestAvisosUIF:
    """Test Avisos UIF/SAT CRUD"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return s
    
    def test_list_avisos(self, session):
        """GET /api/pld/avisos - list UIF notices"""
        response = session.get(f"{BASE_URL}/api/pld/avisos")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} avisos UIF")
    
    def test_create_aviso(self, session):
        """POST /api/pld/avisos - create UIF notice"""
        response = session.post(f"{BASE_URL}/api/pld/avisos", json={
            "tipo_aviso": "operacion_vulnerable",
            "numero_folio": "TEST-SAT-2026-001",
            "fecha_presentacion": "2026-01-15",
            "monto": 250000,
            "descripcion": "TEST_aviso_operacion_vulnerable",
            "estatus": "pendiente"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "aviso_id" in data
        assert data["tipo_aviso"] == "operacion_vulnerable"
        assert data["numero_folio"] == "TEST-SAT-2026-001"
        assert data["monto"] == 250000
        assert data["estatus"] == "pendiente"
        
        print(f"✓ Created aviso {data['aviso_id']}")
        return data["aviso_id"]
    
    def test_update_aviso(self, session):
        """PUT /api/pld/avisos/{id} - update UIF notice"""
        # Create one first
        create_resp = session.post(f"{BASE_URL}/api/pld/avisos", json={
            "tipo_aviso": "operacion_inusual",
            "monto": 100000,
            "descripcion": "TEST_aviso_to_update",
            "estatus": "pendiente"
        })
        assert create_resp.status_code == 200
        aviso_id = create_resp.json()["aviso_id"]
        
        # Update it
        response = session.put(f"{BASE_URL}/api/pld/avisos/{aviso_id}", json={
            "tipo_aviso": "operacion_inusual",
            "monto": 100000,
            "estatus": "presentado",
            "acuse_recepcion": "ACU-2026-12345"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["estatus"] == "presentado"
        assert data["acuse_recepcion"] == "ACU-2026-12345"
        
        print(f"✓ Updated aviso to estatus=presentado")


class TestMatrizRiesgo:
    """Test Matriz de Riesgo for donors"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return s
    
    def test_get_matriz_riesgo(self, session):
        """GET /api/pld/matriz-riesgo - risk matrix for all donors"""
        response = session.get(f"{BASE_URL}/api/pld/matriz-riesgo")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "stats" in data
        assert "matriz" in data
        
        # Verify stats
        stats = data["stats"]
        assert "total_donantes" in stats
        assert "criticos" in stats
        assert "altos" in stats
        assert "medios" in stats
        assert "bajos" in stats
        
        # Verify matriz entries
        for entry in data["matriz"]:
            assert "donante_id" in entry
            assert "nombre" in entry
            assert "score_riesgo" in entry
            assert "nivel_riesgo" in entry
            assert "factores" in entry
            assert entry["nivel_riesgo"] in ["critico", "alto", "medio", "bajo"]
            assert 0 <= entry["score_riesgo"] <= 100
        
        print(f"✓ Matriz riesgo: {stats['total_donantes']} donantes - {stats['criticos']} criticos, {stats['altos']} altos")


class TestKYCDonantes:
    """Test KYC (Know Your Customer) for donors"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return s
    
    def test_get_kyc_status(self, session):
        """GET /api/pld/kyc-status - get KYC completion status"""
        response = session.get(f"{BASE_URL}/api/pld/kyc-status")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        
        for entry in data:
            assert "donante_id" in entry
            assert "nombre" in entry
            assert "kyc_fields" in entry
            assert "kyc_completado" in entry
            assert "kyc_total" in entry
            assert "kyc_porcentaje" in entry
            
            # Verify KYC fields structure
            kyc_fields = entry["kyc_fields"]
            assert "identificacion" in kyc_fields
            assert "constancia_fiscal" in kyc_fields
            assert "beneficiario_controlador" in kyc_fields
        
        print(f"✓ KYC status for {len(data)} donantes")
    
    def test_update_kyc(self, session):
        """PUT /api/pld/kyc/{donante_id} - update donor KYC"""
        # Get a donante first
        donantes_resp = session.get(f"{BASE_URL}/api/donantes")
        assert donantes_resp.status_code == 200
        donantes = donantes_resp.json()
        
        if not donantes:
            pytest.skip("No donantes available for KYC test")
        
        donante_id = donantes[0]["donante_id"]
        
        # Update KYC
        response = session.put(f"{BASE_URL}/api/pld/kyc/{donante_id}", json={
            "nivel_riesgo": "medio",
            "es_pep": False,
            "jurisdiccion_riesgo": "bajo",
            "tiene_identificacion": True,
            "tiene_constancia_fiscal": True,
            "beneficiario_controlador": "TEST_Beneficiario Controlador SA de CV"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["nivel_riesgo"] == "medio"
        assert data["tiene_identificacion"] == True
        assert data["tiene_constancia_fiscal"] == True
        assert "TEST_Beneficiario" in data["beneficiario_controlador"]
        
        print(f"✓ Updated KYC for donante {donante_id}")


class TestDueDiligence:
    """Test Due Diligence log"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return s
    
    def test_list_due_diligence(self, session):
        """GET /api/pld/due-diligence - list DD logs"""
        response = session.get(f"{BASE_URL}/api/pld/due-diligence")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} due diligence entries")
    
    def test_create_due_diligence(self, session):
        """POST /api/pld/due-diligence - create DD entry"""
        # Get a donante first
        donantes_resp = session.get(f"{BASE_URL}/api/donantes")
        assert donantes_resp.status_code == 200
        donantes = donantes_resp.json()
        
        if not donantes:
            pytest.skip("No donantes available for DD test")
        
        donante_id = donantes[0]["donante_id"]
        
        response = session.post(f"{BASE_URL}/api/pld/due-diligence", json={
            "donante_id": donante_id,
            "tipo_revision": "periodica",
            "resultado": "aprobado",
            "hallazgos": "TEST_Sin hallazgos relevantes. Documentacion completa.",
            "documentos_revisados": ["identificacion", "constancia_fiscal", "comprobante_domicilio"],
            "notas": "TEST_Revision periodica completada satisfactoriamente"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "dd_id" in data
        assert data["donante_id"] == donante_id
        assert data["tipo_revision"] == "periodica"
        assert data["resultado"] == "aprobado"
        assert "TEST_Sin hallazgos" in data["hallazgos"]
        
        print(f"✓ Created due diligence entry {data['dd_id']}")
    
    def test_create_due_diligence_invalid_donante(self, session):
        """POST /api/pld/due-diligence - should fail with invalid donante"""
        response = session.post(f"{BASE_URL}/api/pld/due-diligence", json={
            "donante_id": "invalid_donante_id_12345",
            "tipo_revision": "inicial",
            "resultado": "pendiente"
        })
        assert response.status_code == 404
        print(f"✓ Correctly rejected DD for invalid donante")


class TestEdgeCases:
    """Test edge cases and error handling"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return s
    
    def test_declaracion_not_found(self, session):
        """GET /api/declaraciones/{id} - should return 404 for invalid ID"""
        response = session.get(f"{BASE_URL}/api/declaraciones/invalid_dec_id_12345")
        assert response.status_code == 404
        print(f"✓ Correctly returned 404 for invalid declaracion")
    
    def test_duplicate_ejercicio_fiscal(self, session):
        """POST /api/declaraciones - should reject duplicate ejercicio"""
        # Clean up first
        existing = session.get(f"{BASE_URL}/api/declaraciones")
        if existing.status_code == 200:
            for dec in existing.json():
                if dec.get("ejercicio_fiscal") == 2093:
                    session.delete(f"{BASE_URL}/api/declaraciones/{dec['declaracion_id']}")
        
        # Create first one
        resp1 = session.post(f"{BASE_URL}/api/declaraciones", json={
            "ejercicio_fiscal": 2093,
            "ingresos_donativos_efectivo": 10000
        })
        assert resp1.status_code == 200
        dec_id = resp1.json()["declaracion_id"]
        
        # Try to create duplicate
        resp2 = session.post(f"{BASE_URL}/api/declaraciones", json={
            "ejercicio_fiscal": 2093,
            "ingresos_donativos_efectivo": 20000
        })
        assert resp2.status_code == 400
        assert "existe" in resp2.json().get("detail", "").lower()
        
        print(f"✓ Correctly rejected duplicate ejercicio fiscal")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/declaraciones/{dec_id}")
    
    def test_aviso_not_found(self, session):
        """PUT /api/pld/avisos/{id} - should return 404 for invalid ID"""
        response = session.put(f"{BASE_URL}/api/pld/avisos/invalid_aviso_id", json={
            "tipo_aviso": "operacion_vulnerable",
            "monto": 100000,
            "estatus": "pendiente"
        })
        assert response.status_code == 404
        print(f"✓ Correctly returned 404 for invalid aviso")
    
    def test_kyc_donante_not_found(self, session):
        """PUT /api/pld/kyc/{donante_id} - should return 404 for invalid donante"""
        response = session.put(f"{BASE_URL}/api/pld/kyc/invalid_donante_id", json={
            "nivel_riesgo": "bajo"
        })
        assert response.status_code == 404
        print(f"✓ Correctly returned 404 for invalid donante KYC")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
