import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Shield, UserPlus, Trash2 } from "lucide-react";

export const MembersSection = ({
  members, myRole, inviteDialogOpen, setInviteDialogOpen, inviteEmail, setInviteEmail,
  inviteRole, setInviteRole, inviting, onInvite, onChangeRole, onRemoveMember
}) => (
  <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>Miembros y Roles</CardTitle>
            <CardDescription>Gestiona quien tiene acceso a esta organizacion y su nivel de permisos</CardDescription>
          </div>
        </div>
        {myRole === "admin" && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700" data-testid="invite-member-btn"><UserPlus className="w-4 h-4 mr-2" />Invitar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invitar Miembro</DialogTitle>
                <DialogDescription>El usuario debe tener una cuenta registrada en DonatariaSAT.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email del usuario *</Label>
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="usuario@ejemplo.com" type="email" data-testid="invite-email-input" />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger data-testid="invite-role-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin - Acceso total</SelectItem>
                      <SelectItem value="editor">Editor - Crear y editar</SelectItem>
                      <SelectItem value="viewer">Viewer - Solo lectura</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500 space-y-1 mt-2">
                    <p><strong>Admin:</strong> Puede gestionar miembros, configuracion y eliminar datos</p>
                    <p><strong>Editor:</strong> Puede crear y editar donantes, donativos, CFDIs y reportes</p>
                    <p><strong>Viewer:</strong> Solo puede ver informacion, sin modificar datos</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancelar</Button>
                <Button onClick={onInvite} disabled={inviting} className="bg-violet-600 hover:bg-violet-700" data-testid="submit-invite-btn">
                  {inviting ? "Invitando..." : "Invitar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3" data-testid="members-list">
        {members.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No hay miembros</p>
        ) : (
          members.map((member) => (
            <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors" data-testid={`member-${member.user_id}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                  {member.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {myRole === "admin" ? (
                  <Select value={member.role} onValueChange={(newRole) => onChangeRole(member.user_id, newRole)} disabled={member.email === members.find(m => m.role === 'admin')?.email && members.filter(m => m.role === 'admin').length <= 1}>
                    <SelectTrigger className="w-28 h-8 text-xs" data-testid={`role-select-${member.user_id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={`text-xs ${member.role === 'admin' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : member.role === 'editor' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-gray-200 text-gray-600 bg-gray-50'}`}>
                    {member.role}
                  </Badge>
                )}
                {myRole === "admin" && member.role !== "admin" && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => onRemoveMember(member.user_id)} data-testid={`remove-member-${member.user_id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </CardContent>
  </Card>
);
