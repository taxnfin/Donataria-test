import requests
import sys
import json
from datetime import datetime, timezone
import uuid

class DonatariaSATTester:
    def __init__(self, base_url="https://donor-portal-12.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.organizacion_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_health(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_register(self):
        """Test user registration"""
        timestamp = int(datetime.now().timestamp())
        test_data = {
            "email": f"test.user.{timestamp}@example.com",
            "password": "TestPass123!",
            "name": "Test User",
            "organizacion_nombre": "Fundación Test A.C."
        }
        
        success, response = self.run_test("User Registration", "POST", "auth/register", 200, test_data)
        if success:
            self.session_token = response.get('token')
            self.user_id = response.get('user_id')
            self.organizacion_id = response.get('organizacion_id')
            print(f"   User ID: {self.user_id}")
            print(f"   Org ID: {self.organizacion_id}")
        return success

    def test_login(self):
        """Test user login with existing credentials"""
        # Create a user first for login test
        timestamp = int(datetime.now().timestamp())
        register_data = {
            "email": f"login.test.{timestamp}@example.com",
            "password": "LoginTest123!",
            "name": "Login Test User",
            "organizacion_nombre": "Login Test Org"
        }
        
        # Register user
        reg_success, reg_response = self.run_test("Pre-Login Registration", "POST", "auth/register", 200, register_data)
        if not reg_success:
            return False
            
        # Now test login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        
        success, response = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        if success:
            # Update session token for subsequent tests
            self.session_token = response.get('token')
            self.user_id = response.get('user_id')
            self.organizacion_id = response.get('organizacion_id')
        return success

    def test_auth_me(self):
        """Test getting current user info"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)[0]

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        return self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)[0]

    def test_donantes_crud(self):
        """Test donantes CRUD operations"""
        # Create donante
        donante_data = {
            "nombre": "Juan Pérez Ejemplo",
            "tipo_persona": "fisica",
            "rfc": "PEJJ800101ABC",
            "es_extranjero": False,
            "email": "juan.perez@example.com",
            "telefono": "55 1234 5678",
            "direccion": "Calle Ejemplo 123, CDMX",
            "pais": "México"
        }
        
        success, response = self.run_test("Create Donante", "POST", "donantes", 200, donante_data)
        if not success:
            return False
            
        donante_id = response.get('donante_id')
        if not donante_id:
            print("❌ No donante_id in response")
            return False
            
        # Get donantes list
        list_success = self.run_test("Get Donantes List", "GET", "donantes", 200)[0]
        if not list_success:
            return False
            
        # Get specific donante
        get_success = self.run_test("Get Specific Donante", "GET", f"donantes/{donante_id}", 200)[0]
        if not get_success:
            return False
            
        # Update donante
        update_data = {**donante_data, "telefono": "55 9876 5432"}
        update_success = self.run_test("Update Donante", "PUT", f"donantes/{donante_id}", 200, update_data)[0]
        if not update_success:
            return False
            
        # Delete donante
        delete_success = self.run_test("Delete Donante", "DELETE", f"donantes/{donante_id}", 200)[0]
        
        return delete_success

    def test_donativos_crud(self):
        """Test donativos CRUD operations"""
        # First create a donante
        donante_data = {
            "nombre": "María González",
            "tipo_persona": "fisica",
            "rfc": "GOMA850215XYZ",
            "es_extranjero": False,
            "email": "maria.gonzalez@example.com"
        }
        
        success, donante_response = self.run_test("Create Donante for Donativo", "POST", "donantes", 200, donante_data)
        if not success:
            return False
            
        donante_id = donante_response.get('donante_id')
        
        # Create donativo
        donativo_data = {
            "donante_id": donante_id,
            "monto": 5000.00,
            "moneda": "MXN",
            "tipo_donativo": "no_oneroso",
            "es_especie": False,
            "fecha_donativo": datetime.now(timezone.utc).isoformat(),
            "notas": "Donativo de prueba"
        }
        
        success, response = self.run_test("Create Donativo", "POST", "donativos", 200, donativo_data)
        if not success:
            return False
            
        donativo_id = response.get('donativo_id')
        
        # Get donativos list
        list_success = self.run_test("Get Donativos List", "GET", "donativos", 200)[0]
        if not list_success:
            return False
            
        # Get specific donativo
        get_success = self.run_test("Get Specific Donativo", "GET", f"donativos/{donativo_id}", 200)[0]
        if not get_success:
            return False
            
        # Delete donativo
        delete_success = self.run_test("Delete Donativo", "DELETE", f"donativos/{donativo_id}", 200)[0]
        
        return delete_success

    def test_cfdis_operations(self):
        """Test CFDI creation and operations"""
        # Create donante and donativo first
        donante_data = {
            "nombre": "Carlos Empresario S.A. de C.V.",
            "tipo_persona": "moral",
            "rfc": "CEM200101ABC",
            "es_extranjero": False,
            "email": "contacto@carlosempresario.com"
        }
        
        success, donante_response = self.run_test("Create Donante for CFDI", "POST", "donantes", 200, donante_data)
        if not success:
            return False
            
        donante_id = donante_response.get('donante_id')
        
        donativo_data = {
            "donante_id": donante_id,
            "monto": 10000.00,
            "moneda": "MXN",
            "tipo_donativo": "no_oneroso",
            "es_especie": False,
            "fecha_donativo": datetime.now(timezone.utc).isoformat()
        }
        
        success, donativo_response = self.run_test("Create Donativo for CFDI", "POST", "donativos", 200, donativo_data)
        if not success:
            return False
            
        donativo_id = donativo_response.get('donativo_id')
        
        # Create CFDI
        cfdi_data = {
            "donativo_id": donativo_id,
            "donante_id": donante_id,
            "monto": 10000.00,
            "moneda": "MXN",
            "tipo_donativo": "no_oneroso",
            "leyenda": "El donante no recibe bienes o servicios a cambio del donativo otorgado."
        }
        
        success, cfdi_response = self.run_test("Create CFDI", "POST", "cfdis", 200, cfdi_data)
        if not success:
            return False
            
        cfdi_id = cfdi_response.get('cfdi_id')
        
        # Get CFDIs list
        list_success = self.run_test("Get CFDIs List", "GET", "cfdis", 200)[0]
        if not list_success:
            return False
            
        # Test timbrado (simulation)
        timbrar_success = self.run_test("Timbrar CFDI", "POST", f"cfdis/{cfdi_id}/timbrar", 200)[0]
        if not timbrar_success:
            return False
            
        # Test cancelar
        cancelar_success = self.run_test("Cancelar CFDI", "POST", f"cfdis/{cfdi_id}/cancelar", 200)[0]
        
        return cancelar_success

    def test_obligaciones_fiscales(self):
        """Test fiscal obligations"""
        # Get obligaciones list
        list_success = self.run_test("Get Obligaciones List", "GET", "obligaciones", 200)[0]
        if not list_success:
            return False
            
        # Create custom obligacion
        obligacion_data = {
            "nombre": "Obligación de Prueba",
            "descripcion": "Descripción de prueba",
            "fundamento_legal": "Art. Test",
            "fecha_limite": datetime(2024, 12, 31, 23, 59, tzinfo=timezone.utc).isoformat(),
            "notas": "Nota de prueba"
        }
        
        create_success = self.run_test("Create Obligacion", "POST", "obligaciones", 200, obligacion_data)[0]
        
        return create_success

    def test_transparencia(self):
        """Test transparency reports"""
        # Get informes list
        list_success = self.run_test("Get Informes List", "GET", "transparencia", 200)[0]
        if not list_success:
            return False
            
        # Create informe
        informe_data = {
            "ejercicio_fiscal": 2024
        }
        
        success, response = self.run_test("Create Informe", "POST", "transparencia", 200, informe_data)
        if not success:
            return False
            
        informe_id = response.get('informe_id')
        
        # Get specific informe
        get_success = self.run_test("Get Specific Informe", "GET", f"transparencia/{informe_id}", 200)[0]
        if not get_success:
            return False
            
        # Update informe
        update_data = {
            "total_donativos_recibidos": 100000.00,
            "total_gastos_admin": 3000.00,
            "descripcion_actividades": "Actividades de prueba",
            "numero_beneficiarios": 50
        }
        
        update_success = self.run_test("Update Informe", "PUT", f"transparencia/{informe_id}", 200, update_data)[0]
        
        return update_success

def main():
    print("🚀 Starting DonatariaSAT API Testing...")
    print("=" * 60)
    
    tester = DonatariaSATTester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health),
        ("User Registration", tester.test_register),
        ("User Login", tester.test_login),
        ("Auth Me", tester.test_auth_me),
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Donantes CRUD", tester.test_donantes_crud),
        ("Donativos CRUD", tester.test_donativos_crud),
        ("CFDIs Operations", tester.test_cfdis_operations),
        ("Obligaciones Fiscales", tester.test_obligaciones_fiscales),
        ("Transparencia", tester.test_transparencia)
    ]
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            success = test_func()
            if not success:
                print(f"❌ {test_name} failed - stopping further tests")
                break
        except Exception as e:
            print(f"❌ {test_name} crashed: {str(e)}")
            break
    
    # Print final results
    print(f"\n{'='*60}")
    print(f"📊 FINAL RESULTS")
    print(f"{'='*60}")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "No tests run")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"  - {failure.get('test', 'Unknown')}: {failure.get('error', failure.get('response', 'Unknown error'))}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())