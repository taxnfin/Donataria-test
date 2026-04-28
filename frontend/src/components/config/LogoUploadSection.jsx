import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { ImageIcon, Upload, Trash2 } from "lucide-react";

export const LogoUploadSection = ({ logoUrl, uploadingLogo, onUpload, onDelete }) => (
  <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>Logo de la Organizacion</CardTitle>
          <CardDescription>Se muestra en todos los PDFs generados (CFDIs, reportes, cumplimiento)</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-6">
        {logoUrl ? (
          <div className="relative group">
            <img src={logoUrl} alt="Logo" className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-white p-1" data-testid="org-logo-preview" />
            <button onClick={onDelete} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" data-testid="delete-logo-btn">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-300" />
          </div>
        )}
        <div className="flex-1">
          <label htmlFor="logo-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{uploadingLogo ? "Subiendo..." : "Subir logo"}</span>
          </label>
          <input id="logo-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={onUpload} className="hidden" data-testid="logo-upload-input" disabled={uploadingLogo} />
          <p className="text-xs text-gray-400 mt-2">PNG, JPG o WebP. Maximo 2MB.</p>
        </div>
      </div>
    </CardContent>
  </Card>
);
