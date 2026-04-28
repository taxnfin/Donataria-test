import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Bell, Mail, Send, CheckCircle2, AlertTriangle } from "lucide-react";

export const NotificationsSection = ({ notificationStatus, sendingTest, sendingNotifications, onSendTest, onSendNotifications }) => (
  <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>Notificaciones por Email</CardTitle>
          <CardDescription>Recibe alertas cuando tus obligaciones fiscales esten proximas a vencer</CardDescription>
        </div>
        {notificationStatus?.email_configured ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Configurado</Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><AlertTriangle className="w-3 h-3 mr-1" /> No configurado</Badge>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      {notificationStatus?.email_configured ? (
        <>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600"><strong>Email de envio:</strong> {notificationStatus.sender_email}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={onSendTest} disabled={sendingTest} data-testid="send-test-email-btn">
              {sendingTest ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />Enviando...</> : <><Mail className="w-4 h-4 mr-2" />Enviar Email de Prueba</>}
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={onSendNotifications} disabled={sendingNotifications} data-testid="send-notifications-btn">
              {sendingNotifications ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Enviando...</> : <><Send className="w-4 h-4 mr-2" />Enviar Recordatorios Ahora</>}
            </Button>
          </div>
          <p className="text-sm text-gray-500">Se enviaran recordatorios para obligaciones que venzan en los proximos 15 dias.</p>
        </>
      ) : (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800"><strong>Para activar las notificaciones:</strong></p>
          <ol className="text-sm text-amber-700 mt-2 space-y-1 list-decimal list-inside">
            <li>Crea una cuenta en <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">resend.com</a></li>
            <li>Obten tu API Key desde el dashboard</li>
            <li>Configura las variables de entorno: RESEND_API_KEY y SENDER_EMAIL</li>
          </ol>
        </div>
      )}
    </CardContent>
  </Card>
);
