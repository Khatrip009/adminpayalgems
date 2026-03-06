// src/pages/craftsmen/CraftsmanForm.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "@/lib/apiClient"; // adjust path if needed

type Contact = {
  phone?: string;
  email?: string;
  address?: string;
};

type BankDetails = {
  bank_name?: string;
  account_number?: string;
  ifsc?: string;
};

type Kyc = {
  aadhaar?: string;
  pan?: string;
  bank?: BankDetails;
};

type CraftsmanPayload = {
  code?: string | null;
  name: string;
  contact?: Contact;
  is_inhouse?: boolean;
  kyc?: Kyc;
};

export default function CraftsmanForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [code, setCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isInhouse, setIsInhouse] = useState<boolean>(false);

  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  const [aadhaar, setAadhaar] = useState<string>("");
  const [pan, setPan] = useState<string>("");

  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ifsc, setIfsc] = useState<string>("");

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch<{ ok: boolean; craftsmen?: any }>(
          `/craftsmen/${id}`
        );
        if (res?.ok && res.craftsmen) {
          const c = res.craftsmen;
          setCode(c.code || "");
          setName(c.name || "");
          setIsInhouse(Boolean(c.is_inhouse));
          const contact = c.contact || {};
          setPhone(contact.phone || "");
          setEmail(contact.email || "");
          setAddress(contact.address || "");
          const kyc: any = c.kyc || {};
          setAadhaar(kyc.aadhaar || "");
          setPan(kyc.pan || "");
          const bank: any = kyc.bank || {};
          setBankName(bank.bank_name || "");
          setAccountNumber(bank.account_number || "");
          setIfsc(bank.ifsc || "");
        } else {
          // not found or error
          // navigate back to list
          navigate("/craftsmen");
        }
      } catch (err) {
        console.error("fetch craftsman error:", err);
        navigate("/craftsmen");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, navigate]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name || !name.trim()) e.name = "Name is required";
    if (code && code.length > 50) e.code = "Code is too long";
    if (aadhaar && !/^\d{12}$/.test(aadhaar)) e.aadhaar = "Aadhaar must be 12 digits";
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan)) e.pan = "PAN format invalid";
    if (accountNumber && accountNumber.length < 6) e.accountNumber = "Account number seems short";
    if (ifsc && !/^[A-Za-z]{4}0[A-Z0-9]{6}$/.test(ifsc)) e.ifsc = "IFSC format seems invalid";
    // simple phone/email checks
    if (phone && phone.length < 7) e.phone = "Phone number seems short";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email is invalid";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: CraftsmanPayload = {
      code: code || null,
      name: name.trim(),
      is_inhouse: isInhouse,
      contact: {
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
      },
      kyc: {
        aadhaar: aadhaar || undefined,
        pan: pan || undefined,
        bank: {
          bank_name: bankName || undefined,
          account_number: accountNumber || undefined,
          ifsc: ifsc || undefined,
        },
      },
    };

    try {
      setSubmitting(true);
      if (isEdit) {
        const res = await apiFetch(`/craftsmen/${id}`, {
          method: "PATCH",
          body: payload,
        });
        if (res?.ok) {
          navigate(`/craftsmen/${id}`);
        } else {
          setErrors({ form: res?.error || "update_failed" });
        }
      } else {
        const res = await apiFetch("/craftsmen", {
          method: "POST",
          body: payload,
        });
        if (res?.ok && res.craftsmen) {
          navigate(`/craftsmen/${res.craftsmen.id}`);
        } else {
          setErrors({ form: res?.error || "create_failed" });
        }
      }
    } catch (err: any) {
      console.error("submit error:", err);
      setErrors({ form: err?.message || "network_error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">
        {isEdit ? "Edit Craftsman" : "Create Craftsman"}
      </h1>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Code (optional)</label>
              <input
                className="mt-1 w-full border rounded p-2"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CRFT-001"
              />
              {errors.code && <p className="text-red-600 text-sm mt-1">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Name *</label>
              <input
                className="mt-1 w-full border rounded p-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Full name"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>
          </div>

          <div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={isInhouse}
                onChange={(e) => setIsInhouse(e.target.checked)}
                className="form-checkbox"
              />
              <span className="text-sm">Is In-house</span>
            </label>
          </div>

          {/* Contact */}
          <fieldset className="border rounded p-4">
            <legend className="px-2 text-sm font-medium">Contact</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div>
                <label className="block text-sm">Phone</label>
                <input className="mt-1 w-full border rounded p-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm">Email</label>
                <input className="mt-1 w-full border rounded p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm">Address</label>
                <textarea className="mt-1 w-full border rounded p-2" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
          </fieldset>

          {/* KYC */}
          <fieldset className="border rounded p-4">
            <legend className="px-2 text-sm font-medium">KYC (Aadhaar / PAN / Bank)</legend>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div>
                <label className="block text-sm">Aadhaar (12 digits)</label>
                <input className="mt-1 w-full border rounded p-2" value={aadhaar} onChange={(e) => setAadhaar(e.target.value.trim())} />
                {errors.aadhaar && <p className="text-red-600 text-sm mt-1">{errors.aadhaar}</p>}
              </div>

              <div>
                <label className="block text-sm">PAN</label>
                <input className="mt-1 w-full border rounded p-2" value={pan} onChange={(e) => setPan(e.target.value.trim().toUpperCase())} />
                {errors.pan && <p className="text-red-600 text-sm mt-1">{errors.pan}</p>}
              </div>

              <div />
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Bank Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm">Bank Name</label>
                  <input className="mt-1 w-full border rounded p-2" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm">Account Number</label>
                  <input className="mt-1 w-full border rounded p-2" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                  {errors.accountNumber && <p className="text-red-600 text-sm mt-1">{errors.accountNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm">IFSC</label>
                  <input className="mt-1 w-full border rounded p-2" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} />
                  {errors.ifsc && <p className="text-red-600 text-sm mt-1">{errors.ifsc}</p>}
                </div>
              </div>
            </div>
          </fieldset>

          {errors.form && <div className="text-red-600">{errors.form}</div>}

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Craftsman"}
            </button>

            <button
              type="button"
              className="px-4 py-2 border rounded"
              onClick={() => navigate("/craftsmen")}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
