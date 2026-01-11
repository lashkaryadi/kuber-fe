import { useEffect, useState } from "react";
import { getCompany, saveCompany, uploadCompanyImage } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";

export default function SettingsCompany() {
  const [form, setForm] = useState({
    companyName: "",
    gstNumber: "",
    taxRate: 0,
    phone: "",
    email: "",
    address: "",
    logoUrl: "",
    signatureUrl: "",
  });

  const [logo, setLogo] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      const data = await getCompany();
      if (data) {
        setForm({
          companyName: data.companyName || "",
          gstNumber: data.gstNumber || "",
          taxRate: data.taxRate || 0,
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          logoUrl: data.logoUrl || "",
          signatureUrl: data.signatureUrl || "",
        });

        if (data.logoUrl) {
          setLogoPreview(`http://localhost:5001${data.logoUrl}`);
        }
        if (data.signatureUrl) {
          setSignaturePreview(`http://localhost:5001${data.signatureUrl}`);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load company profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignature(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview("");
    setForm({ ...form, logoUrl: "" });
  };

  const removeSignature = () => {
    setSignature(null);
    setSignaturePreview("");
    setForm({ ...form, signatureUrl: "" });
  };

  const save = async () => {
    try {
      setSaving(true);

      const payload: any = {
        companyName: form.companyName,
        gstNumber: form.gstNumber,
        taxRate: form.taxRate,
        phone: form.phone,
        email: form.email,
        address: form.address,
      };

      // Upload logo if new file selected
      if (logo) {
        try {
          const url = await uploadCompanyImage(logo);
          payload.logoUrl = url;
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload logo",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      } else if (form.logoUrl) {
        payload.logoUrl = form.logoUrl;
      }

      // Upload signature if new file selected
      if (signature) {
        try {
          const url = await uploadCompanyImage(signature);
          payload.signatureUrl = url;
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload signature",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      } else if (form.signatureUrl) {
        payload.signatureUrl = form.signatureUrl;
      }

      const success = await saveCompany(payload);
      if (success) {
        toast({
          title: "Success",
          description: "Company profile saved successfully!",
        });
        
        // Reload to get updated URLs
        await loadCompany();
        setLogo(null);
        setSignature(null);
      } else {
        toast({
          title: "Error",
          description: "Failed to save company profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Company Settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Company Settings">
      <div className="p-6 space-y-6 max-w-6xl">
        <div>
          <h1 className="text-2xl font-semibold">Company Settings</h1>
          <p className="text-muted-foreground">
            Manage your company profile used on invoices
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                  placeholder="Kuber Gems Pvt Ltd"
                />
              </div>

              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input
                  value={form.gstNumber}
                  onChange={(e) =>
                    setForm({ ...form, gstNumber: e.target.value })
                  }
                  placeholder="08ABCDE1234F1Z9"
                />
              </div>

              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  value={form.taxRate}
                  onChange={(e) =>
                    setForm({ ...form, taxRate: Number(e.target.value) })
                  }
                  placeholder="18"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="billing@kuber.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Jaipur, Rajasthan, India"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Upload */}
              <div className="space-y-3">
                <Label>Company Logo</Label>
                {logoPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="h-32 w-32 rounded border object-contain bg-white"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={removeLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload logo
                      </p>
                    </div>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Signature Upload */}
              <div className="space-y-3">
                <Label>Authorized Signature</Label>
                {signaturePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={signaturePreview}
                      alt="Signature"
                      className="h-32 w-32 rounded border object-contain bg-white"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={removeSignature}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="signature-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload signature
                      </p>
                    </div>
                    <input
                      id="signature-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={save} disabled={saving || !form.companyName}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Company"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}