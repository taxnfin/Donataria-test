"""
RBAC (Roles & Permissions) Tests for DonatariaSAT
Iteration 9 - Testing role-based access control

Roles: admin, editor, viewer
- Admin: Full access (create, edit, delete, manage members)
- Editor: Create and edit (no delete, no member management)
- Viewer: Read-only access

Test credentials:
- Admin: test@donataria.org / Test1234!
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
ADMIN_EMAIL = "test@donataria.org"
ADMIN_PASSWORD = "Test1234!"

# Generate unique test user emails
TEST_VIEWER_EMAIL = f"test_viewer_{uuid.uuid4().hex[:8]}@test.com"
TEST_EDITOR_EMAIL = f"test_editor_{uuid.uuid4().hex[:8]}@test.com"
TEST_VIEWER_PASSWORD = "TestViewer123!"
TEST_EDITOR_PASSWORD = "TestEditor123!"


class TestRBACSetup:
    """Setup tests - register test users and get tokens"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in login response"
        return data["token"]
    
    def test_admin_login(self, admin_token):
        """Test admin can login"""
        assert admin_token is not None
        print(f"Admin token obtained: {admin_token[:20]}...")
    
    def test_register_viewer_user(self):
        """Register a test viewer user"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_VIEWER_EMAIL,
            "password": TEST_VIEWER_PASSWORD,
            "name": "Test Viewer User"
        })
        # May already exist or succeed
        assert response.status_code in [200, 400], f"Register failed: {response.text}"
        if response.status_code == 200:
            print(f"Registered viewer user: {TEST_VIEWER_EMAIL}")
        else:
            print(f"Viewer user may already exist: {response.json()}")
    
    def test_register_editor_user(self):
        """Register a test editor user"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EDITOR_EMAIL,
            "password": TEST_EDITOR_PASSWORD,
            "name": "Test Editor User"
        })
        assert response.status_code in [200, 400], f"Register failed: {response.text}"
        if response.status_code == 200:
            print(f"Registered editor user: {TEST_EDITOR_EMAIL}")
        else:
            print(f"Editor user may already exist: {response.json()}")


class TestRoleManagementEndpoints:
    """Test role management endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get admin session with token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        return session
    
    def test_get_my_role(self, admin_session):
        """GET /api/organizacion/mi-rol - returns role for current user"""
        response = admin_session.get(f"{BASE_URL}/api/organizacion/mi-rol")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "role" in data, "Response should contain 'role'"
        assert "organizacion_id" in data, "Response should contain 'organizacion_id'"
        # Admin user should have admin role
        assert data["role"] == "admin", f"Expected admin role, got {data['role']}"
        print(f"My role: {data['role']} for org: {data['organizacion_id']}")
    
    def test_get_members_list(self, admin_session):
        """GET /api/organizacion/miembros - returns members list with roles"""
        response = admin_session.get(f"{BASE_URL}/api/organizacion/miembros")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        if len(data) > 0:
            member = data[0]
            assert "user_id" in member, "Member should have user_id"
            assert "email" in member, "Member should have email"
            assert "name" in member, "Member should have name"
            assert "role" in member, "Member should have role"
            print(f"Found {len(data)} members in organization")
            for m in data:
                print(f"  - {m['email']}: {m['role']}")
    
    def test_auth_me_returns_role(self, admin_session):
        """GET /api/auth/me - returns role and roles array"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "role" in data, "Response should contain 'role'"
        assert "roles" in data, "Response should contain 'roles' array"
        assert isinstance(data["roles"], list), "'roles' should be a list"
        print(f"User role: {data['role']}")
        print(f"User roles array: {data['roles']}")


class TestInviteMember:
    """Test inviting members to organization"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get admin session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        return session
    
    def test_invite_viewer_member(self, admin_session):
        """POST /api/organizacion/miembros - invite a member as viewer"""
        # First register the user
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_VIEWER_EMAIL,
            "password": TEST_VIEWER_PASSWORD,
            "name": "Test Viewer User"
        })
        
        # Invite to org as viewer
        response = admin_session.post(f"{BASE_URL}/api/organizacion/miembros", json={
            "user_email": TEST_VIEWER_EMAIL,
            "role": "viewer"
        })
        assert response.status_code == 200, f"Failed to invite viewer: {response.text}"
        data = response.json()
        assert "message" in data, "Response should have message"
        assert "user_id" in data, "Response should have user_id"
        print(f"Invited viewer: {data}")
    
    def test_invite_editor_member(self, admin_session):
        """POST /api/organizacion/miembros - invite a member as editor"""
        # First register the user
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EDITOR_EMAIL,
            "password": TEST_EDITOR_PASSWORD,
            "name": "Test Editor User"
        })
        
        # Invite to org as editor
        response = admin_session.post(f"{BASE_URL}/api/organizacion/miembros", json={
            "user_email": TEST_EDITOR_EMAIL,
            "role": "editor"
        })
        assert response.status_code == 200, f"Failed to invite editor: {response.text}"
        data = response.json()
        print(f"Invited editor: {data}")
    
    def test_invite_nonexistent_user_fails(self, admin_session):
        """POST /api/organizacion/miembros - inviting non-existent user should fail"""
        response = admin_session.post(f"{BASE_URL}/api/organizacion/miembros", json={
            "user_email": f"nonexistent_{uuid.uuid4().hex[:8]}@test.com",
            "role": "viewer"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print("Correctly rejected non-existent user invitation")
    
    def test_invite_invalid_role_fails(self, admin_session):
        """POST /api/organizacion/miembros - invalid role should fail"""
        response = admin_session.post(f"{BASE_URL}/api/organizacion/miembros", json={
            "user_email": TEST_VIEWER_EMAIL,
            "role": "superadmin"  # Invalid role
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("Correctly rejected invalid role")


class TestChangeMemberRole:
    """Test changing member roles"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get admin session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        return session
    
    @pytest.fixture(scope="class")
    def viewer_user_id(self, admin_session):
        """Get viewer user ID from members list"""
        # First ensure viewer is invited
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_VIEWER_EMAIL,
            "password": TEST_VIEWER_PASSWORD,
            "name": "Test Viewer User"
        })
        admin_session.post(f"{BASE_URL}/api/organizacion/miembros", json={
            "user_email": TEST_VIEWER_EMAIL,
            "role": "viewer"
        })
        
        response = admin_session.get(f"{BASE_URL}/api/organizacion/miembros")
        members = response.json()
        for m in members:
            if m["email"] == TEST_VIEWER_EMAIL:
                return m["user_id"]
        pytest.skip("Viewer user not found in members")
    
    def test_change_member_role(self, admin_session, viewer_user_id):
        """PUT /api/organizacion/miembros/{id}/role - change a member's role"""
        response = admin_session.put(
            f"{BASE_URL}/api/organizacion/miembros/{viewer_user_id}/role",
            json={"user_email": "", "role": "editor"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"Changed role: {data}")
        
        # Change back to viewer
        response = admin_session.put(
            f"{BASE_URL}/api/organizacion/miembros/{viewer_user_id}/role",
            json={"user_email": "", "role": "viewer"}
        )
        assert response.status_code == 200


class TestRoleBasedAccessDonantes:
    """Test role-based access for donantes endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get admin session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        return session
    
    @pytest.fixture(scope="class")
    def viewer_session(self, admin_session):
        """Get viewer session after being invited"""
        # Register and invite viewer
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_VIEWER_EMAIL,
            "password": TEST_VIEWER_PASSWORD,
            "name": "Test Viewer User"
        })
        admin_session.post(f"{BASE_URL}/api/organizacion/miembros", json={
            "user_email": TEST_VIEWER_EMAIL,
            "role": "viewer"
        })
        
        # Login as viewer
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_VIEWER_EMAIL,
            "password": TEST_VIEWER_PASSWORD
        })
        assert response.status_code == 200, f"Viewer login failed: {response.text}"
        token = response.json()["token"]
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        return session
    
    @pytest.fixture(scope="class")
    def editor_session(self, admin_session):
        """Get editor session after being invited"""
        # Register and invite editor
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EDITOR_EMAIL,
            "password": TEST_EDITOR_PASSWORD,
            "name": "Test Editor User"
        })
        admin_session.post(f"{BASE_URL}/api/organizacion/miembros", json={
            "user_email": TEST_EDITOR_EMAIL,
            "role": "editor"
        })
        
        # Login as editor
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EDITOR_EMAIL,
            "password": TEST_EDITOR_PASSWORD
        })
        assert response.status_code == 200, f"Editor login failed: {response.text}"
        token = response.json()["token"]
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        return session
    
    def test_admin_can_create_donante(self, admin_session):
        """Admin should be able to create donante"""
        response = admin_session.post(f"{BASE_URL}/api/donantes", json={
            "nombre": f"TEST_Admin_Donante_{uuid.uuid4().hex[:6]}",
            "rfc": "ABC123456XX0",  # Valid 12-char RFC for moral
            "tipo_persona": "moral",
            "email": "admin_donante@test.com"
        })
        assert response.status_code == 200, f"Admin create donante failed: {response.text}"
        data = response.json()
        assert "donante_id" in data
        print(f"Admin created donante: {data['donante_id']}")
        return data["donante_id"]
    
    def test_editor_can_create_donante(self, editor_session, admin_session):
        """Editor should be able to create donante"""
        # Get admin's org ID and switch editor to it
        me_response = admin_session.get(f"{BASE_URL}/api/auth/me")
        admin_org_id = me_response.json().get("organizacion_id")
        
        # Switch editor to admin's org
        editor_session.put(f"{BASE_URL}/api/organizaciones/switch/{admin_org_id}")
        
        response = editor_session.post(f"{BASE_URL}/api/donantes", json={
            "nombre": f"TEST_Editor_Donante_{uuid.uuid4().hex[:6]}",
            "rfc": "DEF123456XX0",  # Valid 12-char RFC for moral
            "tipo_persona": "moral",
            "email": "editor_donante@test.com"
        })
        assert response.status_code == 200, f"Editor create donante failed: {response.text}"
        data = response.json()
        assert "donante_id" in data
        print(f"Editor created donante: {data['donante_id']}")
    
    def test_viewer_cannot_create_donante(self, viewer_session, admin_session):
        """Viewer should NOT be able to create donante (403)"""
        # Get admin's org ID and switch viewer to it
        me_response = admin_session.get(f"{BASE_URL}/api/auth/me")
        admin_org_id = me_response.json().get("organizacion_id")
        
        # Switch viewer to admin's org
        viewer_session.put(f"{BASE_URL}/api/organizaciones/switch/{admin_org_id}")
        
        response = viewer_session.post(f"{BASE_URL}/api/donantes", json={
            "nombre": f"TEST_Viewer_Donante_{uuid.uuid4().hex[:6]}",
            "rfc": "GHI123456XX0",
            "tipo_persona": "moral"
        })
        assert response.status_code == 403, f"Expected 403 for viewer, got {response.status_code}: {response.text}"
        print("Viewer correctly denied donante creation (403)")
    
    def test_viewer_can_read_donantes(self, viewer_session, admin_session):
        """Viewer should be able to read donantes"""
        # Get admin's org ID and switch viewer to it
        me_response = admin_session.get(f"{BASE_URL}/api/auth/me")
        admin_org_id = me_response.json().get("organizacion_id")
        
        # Switch viewer to admin's org
        viewer_session.put(f"{BASE_URL}/api/organizaciones/switch/{admin_org_id}")
        
        response = viewer_session.get(f"{BASE_URL}/api/donantes")
        assert response.status_code == 200, f"Viewer read donantes failed: {response.text}"
        print(f"Viewer can read donantes: {len(response.json())} found")
    
    def test_admin_can_delete_donante(self, admin_session):
        """Admin should be able to delete donante"""
        # First create a donante to delete
        create_response = admin_session.post(f"{BASE_URL}/api/donantes", json={
            "nombre": f"TEST_ToDelete_{uuid.uuid4().hex[:6]}",
            "rfc": "JKL123456XX0",  # Valid 12-char RFC for moral
            "tipo_persona": "moral"
        })
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        donante_id = create_response.json()["donante_id"]
        
        # Delete it
        response = admin_session.delete(f"{BASE_URL}/api/donantes/{donante_id}")
        assert response.status_code == 200, f"Admin delete donante failed: {response.text}"
        print(f"Admin deleted donante: {donante_id}")
    
    def test_editor_cannot_delete_donante(self, admin_session, editor_session):
        """Editor should NOT be able to delete donante (403)"""
        # Get admin's org ID and switch editor to it
        me_response = admin_session.get(f"{BASE_URL}/api/auth/me")
        admin_org_id = me_response.json().get("organizacion_id")
        
        # Switch editor to admin's org
        editor_session.put(f"{BASE_URL}/api/organizaciones/switch/{admin_org_id}")
        
        # Create a donante as admin
        create_response = admin_session.post(f"{BASE_URL}/api/donantes", json={
            "nombre": f"TEST_EditorCantDelete_{uuid.uuid4().hex[:6]}",
            "rfc": "MNO123456XX0",  # Valid 12-char RFC for moral
            "tipo_persona": "moral"
        })
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        donante_id = create_response.json()["donante_id"]
        
        # Try to delete as editor
        response = editor_session.delete(f"{BASE_URL}/api/donantes/{donante_id}")
        assert response.status_code == 403, f"Expected 403 for editor delete, got {response.status_code}: {response.text}"
        print("Editor correctly denied donante deletion (403)")
        
        # Cleanup - delete as admin
        admin_session.delete(f"{BASE_URL}/api/donantes/{donante_id}")


class TestRoleBasedAccessDonativos:
    """Test role-based access for donativos endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get admin session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        return session
    
    @pytest.fixture(scope="class")
    def viewer_session(self, admin_session):
        """Get viewer session"""
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_VIEWER_EMAIL,
            "password": TEST_VIEWER_PASSWORD,
            "name": "Test Viewer User"
        })
        admin_session.post(f"{BASE_URL}/api/organizacion/miembros", json={
            "user_email": TEST_VIEWER_EMAIL,
            "role": "viewer"
        })
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_VIEWER_EMAIL,
            "password": TEST_VIEWER_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        return session
    
    @pytest.fixture(scope="class")
    def test_donante_id(self, admin_session):
        """Create a test donante for donativo tests"""
        response = admin_session.post(f"{BASE_URL}/api/donantes", json={
            "nombre": f"TEST_DonativoTest_{uuid.uuid4().hex[:6]}",
            "rfc": "XAXX010101000",
            "tipo_persona": "moral"
        })
        if response.status_code == 200:
            return response.json()["donante_id"]
        # Get existing donante
        response = admin_session.get(f"{BASE_URL}/api/donantes")
        donantes = response.json()
        if donantes:
            return donantes[0]["donante_id"]
        pytest.skip("No donante available for testing")
    
    def test_viewer_cannot_create_donativo(self, viewer_session, test_donante_id):
        """Viewer should NOT be able to create donativo (403)"""
        response = viewer_session.post(f"{BASE_URL}/api/donativos", json={
            "donante_id": test_donante_id,
            "monto": 1000,
            "moneda": "MXN",
            "tipo_donativo": "efectivo",
            "fecha_donativo": datetime.now().isoformat()
        })
        assert response.status_code == 403, f"Expected 403 for viewer, got {response.status_code}: {response.text}"
        print("Viewer correctly denied donativo creation (403)")


class TestRoleBasedAccessCFDIs:
    """Test role-based access for CFDIs endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get admin session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        return session
    
    @pytest.fixture(scope="class")
    def viewer_session(self, admin_session):
        """Get viewer session"""
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_VIEWER_EMAIL,
            "password": TEST_VIEWER_PASSWORD,
            "name": "Test Viewer User"
        })
        admin_session.post(f"{BASE_URL}/api/organizacion/miembros", json={
            "user_email": TEST_VIEWER_EMAIL,
            "role": "viewer"
        })
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_VIEWER_EMAIL,
            "password": TEST_VIEWER_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        return session
    
    @pytest.fixture(scope="class")
    def editor_session(self, admin_session):
        """Get editor session"""
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EDITOR_EMAIL,
            "password": TEST_EDITOR_PASSWORD,
            "name": "Test Editor User"
        })
        admin_session.post(f"{BASE_URL}/api/organizacion/miembros", json={
            "user_email": TEST_EDITOR_EMAIL,
            "role": "editor"
        })
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EDITOR_EMAIL,
            "password": TEST_EDITOR_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        return session
    
    def test_viewer_cannot_create_cfdi(self, viewer_session):
        """Viewer should NOT be able to create CFDI (403)"""
        # Get a donativo to use
        response = viewer_session.get(f"{BASE_URL}/api/donativos")
        if response.status_code != 200 or not response.json():
            pytest.skip("No donativos available for CFDI test")
        
        donativo = response.json()[0]
        
        response = viewer_session.post(f"{BASE_URL}/api/cfdis", json={
            "donativo_id": donativo["donativo_id"],
            "donante_id": donativo["donante_id"],
            "monto": donativo["monto"],
            "concepto": "Donativo",
            "uso_cfdi": "D04"
        })
        assert response.status_code == 403, f"Expected 403 for viewer, got {response.status_code}: {response.text}"
        print("Viewer correctly denied CFDI creation (403)")
    
    def test_editor_cannot_cancel_cfdi(self, admin_session, editor_session):
        """Editor should NOT be able to cancel CFDI (admin only)"""
        # Get a CFDI to try to cancel
        response = admin_session.get(f"{BASE_URL}/api/cfdis")
        if response.status_code != 200 or not response.json():
            pytest.skip("No CFDIs available for cancel test")
        
        # Find a non-cancelled CFDI
        cfdis = response.json()
        cfdi = None
        for c in cfdis:
            if c.get("estado") != "cancelado":
                cfdi = c
                break
        
        if not cfdi:
            pytest.skip("No non-cancelled CFDIs available")
        
        # Try to cancel as editor
        response = editor_session.post(f"{BASE_URL}/api/cfdis/{cfdi['cfdi_id']}/cancelar")
        assert response.status_code == 403, f"Expected 403 for editor cancel, got {response.status_code}: {response.text}"
        print("Editor correctly denied CFDI cancellation (403)")


class TestRemoveMember:
    """Test removing members from organization"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get admin session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        return session
    
    def test_remove_member(self, admin_session):
        """DELETE /api/organizacion/miembros/{id} - remove a member"""
        # Create a user to remove
        remove_email = f"test_remove_{uuid.uuid4().hex[:8]}@test.com"
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": remove_email,
            "password": "TestRemove123!",
            "name": "Test Remove User"
        })
        
        # Invite them
        admin_session.post(f"{BASE_URL}/api/organizacion/miembros", json={
            "user_email": remove_email,
            "role": "viewer"
        })
        
        # Get their user_id
        response = admin_session.get(f"{BASE_URL}/api/organizacion/miembros")
        members = response.json()
        user_id = None
        for m in members:
            if m["email"] == remove_email:
                user_id = m["user_id"]
                break
        
        if not user_id:
            pytest.skip("Could not find user to remove")
        
        # Remove them
        response = admin_session.delete(f"{BASE_URL}/api/organizacion/miembros/{user_id}")
        assert response.status_code == 200, f"Failed to remove member: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"Removed member: {data}")
        
        # Verify they're gone
        response = admin_session.get(f"{BASE_URL}/api/organizacion/miembros")
        members = response.json()
        for m in members:
            assert m["email"] != remove_email, "Member should have been removed"
        print("Verified member was removed from organization")


class TestViewerCannotManageMembers:
    """Test that viewer cannot manage members"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get admin session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        return session
    
    @pytest.fixture(scope="class")
    def viewer_session(self, admin_session):
        """Get viewer session"""
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_VIEWER_EMAIL,
            "password": TEST_VIEWER_PASSWORD,
            "name": "Test Viewer User"
        })
        admin_session.post(f"{BASE_URL}/api/organizacion/miembros", json={
            "user_email": TEST_VIEWER_EMAIL,
            "role": "viewer"
        })
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_VIEWER_EMAIL,
            "password": TEST_VIEWER_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        return session
    
    def test_viewer_cannot_invite_member(self, viewer_session, admin_session):
        """Viewer should NOT be able to invite members"""
        # Get admin's org ID and switch viewer to it
        me_response = admin_session.get(f"{BASE_URL}/api/auth/me")
        admin_org_id = me_response.json().get("organizacion_id")
        
        # Switch viewer to admin's org
        viewer_session.put(f"{BASE_URL}/api/organizaciones/switch/{admin_org_id}")
        
        response = viewer_session.post(f"{BASE_URL}/api/organizacion/miembros", json={
            "user_email": "someone@test.com",
            "role": "viewer"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("Viewer correctly denied member invitation (403)")
    
    def test_viewer_cannot_view_members(self, viewer_session, admin_session):
        """Viewer should NOT be able to view members list"""
        # Get admin's org ID and switch viewer to it
        me_response = admin_session.get(f"{BASE_URL}/api/auth/me")
        admin_org_id = me_response.json().get("organizacion_id")
        
        # Switch viewer to admin's org
        viewer_session.put(f"{BASE_URL}/api/organizaciones/switch/{admin_org_id}")
        
        response = viewer_session.get(f"{BASE_URL}/api/organizacion/miembros")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("Viewer correctly denied members list access (403)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
