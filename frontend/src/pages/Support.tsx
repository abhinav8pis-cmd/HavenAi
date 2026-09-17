import { useState, useEffect } from 'react';
import { Phone, ExternalLink, AlertTriangle, ShieldCheck, HeartHandshake, Compass, LifeBuoy } from 'lucide-react';

interface SupportResource {
  id: string;
  region: string;
  name: string;
  description?: string;
  phone?: string;
  website?: string;
  emergency: boolean;
}

export function Support() {
  const [resources, setResources] = useState<SupportResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/support')
      .then(res => res.json())
      .then(data => setResources(data))
      .catch(err => console.error('Failed to load support resources:', err))
      .finally(() => setLoading(false));
  }, []);

  const emergencyResources = resources.filter(r => r.emergency);
  const generalResources = resources.filter(r => !r.emergency);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      <header>
        <h2 className="text-3xl md:text-4xl font-medium text-[#2b213a] tracking-tight">Crisis & Support Sanctuary</h2>
        <p className="text-[#2b213a]/60 mt-1">You deserve support beyond this digital space. Real help is always within reach.</p>
      </header>

      {/* Immediate Emergency Banner */}
      <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" /> Immediate Crisis Care
            </div>
            <h3 className="text-2xl font-bold text-red-800">Are you in immediate danger?</h3>
            <p className="text-sm text-red-700 leading-relaxed">
              If you are thinking of hurting yourself, experiencing severe crisis, or in harm's way, please call emergency services immediately or reach a crisis counselor. You don't have to carry this alone.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <a
              href="tel:988"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-md transition-all text-sm text-center"
            >
              <Phone className="w-4 h-4" /> Call 988 (Lifeline)
            </a>
            <a
              href="sms:741741"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-red-50 text-red-700 border border-red-200 font-semibold rounded-2xl transition-all text-sm text-center"
            >
              Text HOME to 741741
            </a>
          </div>
        </div>
      </div>

      {/* Distinction: AI vs Professional Care */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#f9f6f0]/50 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#e2d4f0] flex items-center justify-center text-[#4a3b69]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-semibold text-[#2b213a]">What HAVEN AI Is</h4>
          <ul className="text-sm text-[#2b213a]/70 space-y-2 list-disc list-inside leading-relaxed">
            <li>A reflective, private companion for daily feelings and grounding</li>
            <li>A non-judgmental space to journal, breathe, and untangle thoughts</li>
            <li>A digital compass to guide you toward certified human care</li>
          </ul>
        </div>

        <div className="space-y-3 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800">
            <Compass className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-semibold text-[#2b213a]">What HAVEN AI Is Not</h4>
          <ul className="text-sm text-[#2b213a]/70 space-y-2 list-disc list-inside leading-relaxed">
            <li>Not a licensed therapist, clinical psychologist, or doctor</li>
            <li>Not capable of medical diagnosis, treatment, or psychiatric prescriptions</li>
            <li>Not an emergency response unit or substitute for immediate crisis care</li>
          </ul>
        </div>
      </div>

      {/* Emergency Resources */}
      <div className="space-y-4">
        <h3 className="text-xl font-medium text-[#2b213a] flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-red-500" />
          Crisis Helplines & Emergency Contacts
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergencyResources.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-[#2b213a] text-lg">{item.name}</h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full">
                    {item.region}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs text-[#2b213a]/70 leading-relaxed mb-4">{item.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                {item.phone && (
                  <a
                    href={`tel:${item.phone.replace(/[^0-9]/g, '')}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {item.phone}
                  </a>
                )}
                {item.website && (
                  <a
                    href={item.website}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-[#f9f6f0] hover:bg-[#e2d4f0]/40 text-[#4a3b69] rounded-xl transition-colors"
                    title="Visit official website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Professional Mental Health Resources */}
      <div className="space-y-4">
        <h3 className="text-xl font-medium text-[#2b213a] flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-[#4a3b69]" />
          Finding Professional Therapy & Ongoing Care
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {generalResources.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-[#2b213a] text-lg">{item.name}</h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 bg-[#e2d4f0] text-[#4a3b69] rounded-full">
                    {item.region}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs text-[#2b213a]/70 leading-relaxed mb-4">{item.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                {item.phone && (
                  <a
                    href={`tel:${item.phone}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#f9f6f0] hover:bg-[#e2d4f0]/40 text-[#4a3b69] rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {item.phone}
                  </a>
                )}
                {item.website && (
                  <a
                    href={item.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#4a3b69] hover:bg-[#392d52] text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <span>Visit Directory</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center pt-8 border-t border-gray-200">
        <p className="text-xs text-[#2b213a]/50 max-w-lg mx-auto leading-relaxed">
          HAVEN AI does not monitor conversations in real-time for law enforcement or emergency dispatch. Your privacy is protected, and we urge you to use local phone lines if you feel your physical safety is compromised.
        </p>
      </footer>
    </div>
  );
}

