'use client';

import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  GripVertical,
  Menu,
  Pencil,
  Plus,
  Radio,
  Search,
  Server,
  Sparkles,
  Trash2,
  Upload,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { RootlySidebar } from '@/components/dashboard/RootlySidebar';
import { CreateIncidentModal } from '@/components/dashboard/CreateIncidentModal';

export interface StatusPageRecord {
  id: string;
  name: string;
  slug: string;
  internalDescription: string;
  enabled: boolean;
  isPublic: boolean;
  subdomain: string;
  subscribersCount: number;
  uptimeDurationDays: number;
  publicTitle: string;
  publicDescription: string;
  uptimeMessage: string;
  downtimeMessage: string;
  websiteUrl: string;
  supportUrl: string;
  privacyUrl: string;
  timezone: string;
  allowEmailSubscribers: boolean;
  allowSmsSubscribers: boolean;
  gaTrackingId: string;
  authMethod: 'none' | 'password' | 'saml';
  authPassword?: string;
  samlIdpUrl?: string;
  services: {
    id: string;
    name: string;
    status: 'operational' | 'degraded' | 'outage';
    color: string;
  }[];
  functionalities: string[];
  thirdPartyServices: {
    name: string;
    addedAt: string;
  }[];
  templates: {
    id: string;
    title: string;
    type: 'incident' | 'maintenance';
    enabled: boolean;
    body: string;
  }[];
}

const INITIAL_STATUS_PAGES: StatusPageRecord[] = [
  {
    id: 'sp-demo-1',
    name: '[Demo] Service Status',
    slug: 'demo-service-status',
    internalDescription: 'Primary public-facing status page for core customer services and APIs.',
    enabled: true,
    isPublic: true,
    subdomain: 'status.knotic.io',
    subscribersCount: 0,
    uptimeDurationDays: 60,
    publicTitle: '',
    publicDescription: '',
    uptimeMessage: 'All Systems Operational',
    downtimeMessage: "Something's not quite right",
    websiteUrl: '',
    supportUrl: '',
    privacyUrl: '',
    timezone: '(GMT-07:00) Pacific Time (US & Canada)',
    allowEmailSubscribers: true,
    allowSmsSubscribers: true,
    gaTrackingId: '',
    authMethod: 'none',
    services: [
      { id: 'svc-1', name: '[Demo] API - Authentication', status: 'operational', color: '#FAEBB7' },
      { id: 'svc-2', name: '[Demo] DB - Production Database', status: 'operational', color: '#F4CFD1' },
      { id: 'svc-3', name: '[Demo] UI - User Profile Block', status: 'operational', color: '#D7E7F5' },
    ],
    functionalities: [],
    thirdPartyServices: [
      { name: 'Slack API Webhooks', addedAt: 'Sep 02, 2026' },
      { name: 'AWS us-east-1 Core Services', addedAt: 'Aug 18, 2026' },
    ],
    templates: [
      {
        id: 'tmpl-1',
        title: 'Elevated 5xx Gateway Outage',
        type: 'incident',
        enabled: true,
        body: 'We are investigating elevated 5xx errors affecting incoming API requests. Next update in 15 minutes.',
      },
      {
        id: 'tmpl-2',
        title: 'Scheduled Database Index Rebalance',
        type: 'maintenance',
        enabled: true,
        body: 'Routine zero-downtime maintenance on secondary read replicas.',
      },
    ],
  },
];

type StatusPageTab = 'setup' | 'authentication' | 'customize' | 'components' | 'templates';

export function StatusPageLayout() {
  // Navigation & View Mode
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [activeTab, setActiveTab] = useState<StatusPageTab>('setup');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [isPublicPreviewModalOpen, setIsPublicPreviewModalOpen] = useState(false);

  // Trial Banner
  const [isTrialBannerDismissed, setIsTrialBannerDismissed] = useState(false);

  // Status Pages State
  const [statusPages, setStatusPages] = useState<StatusPageRecord[]>(INITIAL_STATUS_PAGES);
  const [expandedPageId, setExpandedPageId] = useState<string | null>('sp-demo-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Builder Form State
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Tab 1: Setup
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsPublic, setFormIsPublic] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [formAllowEmail, setFormAllowEmail] = useState(true);
  const [formAllowSms, setFormAllowSms] = useState(true);
  const [formExternalDomain, setFormExternalDomain] = useState('');
  const [formGaId, setFormGaId] = useState('');

  // Tab 2: Authentication
  const [formAuthMethod, setFormAuthMethod] = useState<'none' | 'password' | 'saml'>('none');
  const [formAuthPassword, setFormAuthPassword] = useState('');
  const [formSamlIdpUrl, setFormSamlIdpUrl] = useState('');
  const [formSamlCert, setFormSamlCert] = useState('');

  // Tab 3: Customize (Rootly exact fields)
  const [brandOrgName] = useState('Lpu');
  const [formPublicTitle, setFormPublicTitle] = useState('');
  const [formPublicDescription, setFormPublicDescription] = useState('');
  const [formUptimeMessage, setFormUptimeMessage] = useState('All Systems Operational');
  const [formDowntimeMessage, setFormDowntimeMessage] = useState("Something's not quite right");
  const [formLogoFileName, setFormLogoFileName] = useState<string | null>(null);
  const [formFaviconFileName, setFormFaviconFileName] = useState<string | null>(null);
  const [formOgImageFileName, setFormOgImageFileName] = useState<string | null>(null);
  const [formWebsiteUrl, setFormWebsiteUrl] = useState('');
  const [formSupportUrl, setFormSupportUrl] = useState('');
  const [formPrivacyUrl, setFormPrivacyUrl] = useState('');
  const [formTimezone, setFormTimezone] = useState('(GMT-07:00) Pacific Time (US & Canada)');
  const [sectionOrder, setSectionOrder] = useState([
    { id: 'maint', name: 'Scheduled Maintenance', order: 1 },
    { id: 'status', name: 'System Status', order: 2 },
    { id: 'incidents', name: 'Active Incidents', order: 3 },
  ]);

  // Tab 4: Components
  const [formShowUptime, setFormShowUptime] = useState(true);
  const [formUptimeDurationDays, setFormUptimeDurationDays] = useState(60);

  // Tab 5: Templates
  const [templateSubTab, setTemplateSubTab] = useState<'incident' | 'maintenance'>('incident');

  // Copy helper
  const handleCopyLink = (url: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopyToast('Status page link copied to clipboard!');
    setTimeout(() => setCopyToast(null), 2500);
  };

  // Switch to Builder View (New)
  const handleOpenNewBuilder = () => {
    setEditingPageId(null);
    setIsDirty(false);
    setFormName('');
    setFormDescription('');
    setFormIsPublic(false);
    setShowAdvancedSettings(false);
    setFormAllowEmail(true);
    setFormAllowSms(true);
    setFormExternalDomain('');
    setFormGaId('');
    setFormAuthMethod('none');
    setFormAuthPassword('');
    setFormSamlIdpUrl('');
    setFormSamlCert('');
    setFormPublicTitle('');
    setFormPublicDescription('');
    setFormUptimeMessage('All Systems Operational');
    setFormDowntimeMessage("Something's not quite right");
    setFormLogoFileName(null);
    setFormFaviconFileName(null);
    setFormOgImageFileName(null);
    setFormWebsiteUrl('');
    setFormSupportUrl('');
    setFormPrivacyUrl('');
    setFormTimezone('(GMT-07:00) Pacific Time (US & Canada)');
    setFormShowUptime(true);
    setFormUptimeDurationDays(60);
    setActiveTab('setup');
    setView('builder');
  };

  // Switch to Builder View (Edit)
  const handleOpenEditBuilder = (page: StatusPageRecord) => {
    setEditingPageId(page.id);
    setIsDirty(false);
    setFormName(page.name);
    setFormDescription(page.internalDescription);
    setFormIsPublic(page.isPublic);
    setShowAdvancedSettings(false);
    setFormAllowEmail(page.allowEmailSubscribers);
    setFormAllowSms(page.allowSmsSubscribers);
    setFormExternalDomain(page.subdomain);
    setFormGaId(page.gaTrackingId);
    setFormAuthMethod(page.authMethod);
    setFormAuthPassword(page.authPassword || '');
    setFormSamlIdpUrl(page.samlIdpUrl || '');
    setFormPublicTitle(page.publicTitle);
    setFormPublicDescription(page.publicDescription);
    setFormUptimeMessage(page.uptimeMessage || 'All Systems Operational');
    setFormDowntimeMessage(page.downtimeMessage || "Something's not quite right");
    setFormWebsiteUrl(page.websiteUrl);
    setFormSupportUrl(page.supportUrl);
    setFormPrivacyUrl(page.privacyUrl);
    setFormTimezone(page.timezone);
    setFormShowUptime(true);
    setFormUptimeDurationDays(page.uptimeDurationDays);
    setActiveTab('setup');
    setView('builder');
  };

  // Toggle Status Page Enabled
  const handleTogglePageEnabled = (id: string) => {
    setStatusPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
    );
  };

  // Delete Status Page
  const handleDeletePage = (id: string, name: string) => {
    if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to remove ${name}? This will also remove its associated data. This can't be undone.`)) {
      setStatusPages((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Save / Create Status Page from Builder
  const handleSaveStatusPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingPageId) {
      setStatusPages((prev) =>
        prev.map((p) =>
          p.id === editingPageId
            ? {
                ...p,
                name: formName,
                internalDescription: formDescription,
                isPublic: formIsPublic,
                subdomain: formExternalDomain || p.subdomain,
                uptimeDurationDays: formUptimeDurationDays,
                publicTitle: formPublicTitle || formName,
                publicDescription: formPublicDescription,
                uptimeMessage: formUptimeMessage,
                downtimeMessage: formDowntimeMessage,
                websiteUrl: formWebsiteUrl,
                supportUrl: formSupportUrl,
                privacyUrl: formPrivacyUrl,
                timezone: formTimezone,
                allowEmailSubscribers: formAllowEmail,
                allowSmsSubscribers: formAllowSms,
                gaTrackingId: formGaId,
                authMethod: formAuthMethod,
                authPassword: formAuthPassword,
                samlIdpUrl: formSamlIdpUrl,
              }
            : p,
        ),
      );
    } else {
      const newRecord: StatusPageRecord = {
        id: `sp-${Date.now()}`,
        name: formName,
        slug: formName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        internalDescription: formDescription,
        enabled: true,
        isPublic: formIsPublic,
        subdomain: formExternalDomain || `${formName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.knotic.io`,
        subscribersCount: 0,
        uptimeDurationDays: formUptimeDurationDays,
        publicTitle: formPublicTitle || formName,
        publicDescription: formPublicDescription,
        uptimeMessage: formUptimeMessage,
        downtimeMessage: formDowntimeMessage,
        websiteUrl: formWebsiteUrl,
        supportUrl: formSupportUrl,
        privacyUrl: formPrivacyUrl,
        timezone: formTimezone,
        allowEmailSubscribers: formAllowEmail,
        allowSmsSubscribers: formAllowSms,
        gaTrackingId: formGaId,
        authMethod: formAuthMethod,
        services: [
          { id: 'svc-1', name: '[Demo] API - Authentication', status: 'operational', color: '#FAEBB7' },
          { id: 'svc-2', name: '[Demo] DB - Production Database', status: 'operational', color: '#F4CFD1' },
          { id: 'svc-3', name: '[Demo] UI - User Profile Block', status: 'operational', color: '#D7E7F5' },
        ],
        functionalities: [],
        thirdPartyServices: [
          { name: 'Slack API Webhooks', addedAt: 'Today' },
        ],
        templates: [
          {
            id: `tmpl-${Date.now()}`,
            title: 'General Service Degradation',
            type: 'incident',
            enabled: true,
            body: 'We are investigating elevated latency across regional API endpoints.',
          },
        ],
      };
      setStatusPages((prev) => [...prev, newRecord]);
      setExpandedPageId(newRecord.id);
    }

    setIsDirty(false);
    setView('list');
  };

  // Reorder sections helper
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return;
    const newOrder = [...sectionOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    // update order numbers
    setSectionOrder(newOrder.map((item, idx) => ({ ...item, order: idx + 1 })));
    setIsDirty(true);
  };

  // Filtered status pages for listing
  const filteredPages = useMemo(() => {
    return statusPages.filter((page) =>
      page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.internalDescription.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [statusPages, searchQuery]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans antialiased">
      {/* Desktop Persistent Sidebar */}
      <RootlySidebar
        className="hidden md:flex"
        onCreateIncident={() => setIsCreateIncidentOpen(true)}
      />

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-64 max-w-[80vw] flex-1 flex-col bg-white dark:bg-zinc-900 shadow-2xl z-10">
            <div className="absolute right-2 top-3 z-40">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <RootlySidebar
              className="h-full w-full border-r-0"
              onCreateIncident={() => {
                setIsMobileMenuOpen(false);
                setIsCreateIncidentOpen(true);
              }}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <div className="flex flex-1 flex-col min-w-0 min-h-screen">
        {/* Top Yellow Warning Banner */}
        {!isTrialBannerDismissed && (
          <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-800 px-4 py-2 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
              <span>
                <strong className="font-semibold">Your trial is ending in 12 days.</strong> Talk to sales to upgrade your account.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="#talk-to-sales"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Thank you for contacting sales! Our team will reach out shortly.');
                }}
                className="font-medium hover:underline text-yellow-900"
              >
                Talk to sales
              </a>
              <button
                type="button"
                onClick={() => setIsTrialBannerDismissed(true)}
                className="text-yellow-700 hover:text-yellow-900 cursor-pointer"
                aria-label="Dismiss banner"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Header Bar */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Toggle navigation menu"
            className="p-1.5 -ml-1 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-bold tracking-tight">Status Pages</span>
          </div>
        </div>

        {/* Toast Notification */}
        {copyToast && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium shadow-xl animate-in fade-in slide-in-from-top-2">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>{copyToast}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: STATUS PAGES LISTING VIEW (Exact Match to media_1788782178155.png) */}
        {/* ========================================================================= */}
        {view === 'list' && (
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-8 space-y-6">
            {/* Header with Title & + New Status Page Button */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h1 className="text-xl sm:text-[22px] font-semibold text-zinc-900 dark:text-zinc-100">
                Status Pages
              </h1>

              <button
                type="button"
                onClick={handleOpenNewBuilder}
                className="bg-black text-white hover:bg-zinc-800 transition-colors duration-200 rounded-lg px-2.5 py-1.5 h-[30px] inline-flex items-center gap-1.5 text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Status Page</span>
              </button>
            </div>

            {/* Hero Card Banner */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-8 rounded-[20px] border border-gray-300 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/40 p-6 sm:p-8 my-6">
              <div className="flex-1 space-y-2">
                <p className="text-sm sm:text-base font-normal text-zinc-800 dark:text-zinc-200 leading-relaxed max-w-3xl">
                  Let your team and customers know when your services are down with private and public status pages. Show service uptime, post your incidents directly to the page and connect third party services your company is dependent on. You can even integrate directly with{' '}
                  <a
                    href="https://docs.rootly.com/integrations/status-page-io"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Atlassian’s StatusPage.io
                  </a>{' '}
                  and post your incidents straight to there.
                </p>
              </div>

              {/* Graphic Illustration on the Right */}
              <div className="shrink-0 w-full max-w-[280px] sm:max-w-[320px] bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-3.5 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                      Services Down
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Live Sync</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-600 dark:text-zinc-400">Payment Processing</span>
                    <span className="text-rose-600 font-semibold">Degraded</span>
                  </div>
                  <div className="flex gap-0.5 h-3 w-full bg-gray-100 dark:bg-zinc-800 rounded-xs overflow-hidden">
                    {Array.from({ length: 26 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 ${i >= 23 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-gray-100 dark:border-zinc-800">
                  <span>API Services: Operational</span>
                  <span className="text-emerald-600 font-medium">99.98% Uptime</span>
                </div>
              </div>
            </div>

            {/* Transparent Search Filter Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Status Pages"
                  className="w-full h-10 pl-9 pr-8 rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Page Accordion Container */}
            <div className="rounded-md border border-gray-300 dark:border-zinc-800 divide-y divide-gray-300 dark:divide-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
              {filteredPages.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  No status pages matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                filteredPages.map((page) => {
                  const isExpanded = expandedPageId === page.id;

                  return (
                    <div key={page.id} className="w-full">
                      {/* Accordion Summary Row */}
                      <div className="py-4 pl-6 pr-5 flex items-center justify-between gap-4 select-none">
                        {/* Left Side: Toggle Switch + Title + Public Badge + View ↗ */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Custom Rootly-style Switch Toggle */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={page.enabled}
                            onClick={() => handleTogglePageEnabled(page.id)}
                            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              page.enabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-zinc-700'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                page.enabled ? 'translate-x-3' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          {/* Title */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditBuilder(page)}
                            className="font-semibold text-base sm:text-lg text-purple-900 dark:text-purple-300 hover:underline cursor-pointer truncate text-left"
                          >
                            {page.name}
                          </button>

                          {/* Badges & Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {page.isPublic && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400 border border-green-300 dark:border-green-800 rounded-full text-xs font-medium">
                                Public
                              </span>
                            )}

                            {/* View ↗ Button */}
                            <button
                              type="button"
                              onClick={() => setIsPublicPreviewModalOpen(true)}
                              className="px-2 py-0.5 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 rounded-full text-xs inline-flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-zinc-700 cursor-pointer"
                            >
                              <Radio className="h-3 w-3 text-purple-600 shrink-0" />
                              <span>View</span>
                              <ArrowUpRight className="h-3 w-3 shrink-0" />
                            </button>
                          </div>
                        </div>

                        {/* Right Side: Copy, Edit, Delete, Chevron */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Copy URL */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(`https://${page.subdomain}`)}
                            title="Copy Status Page URL"
                            className="h-8 w-8 rounded-md border border-gray-300 dark:border-zinc-700 flex items-center justify-center text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditBuilder(page)}
                            title="Edit Status Page"
                            className="h-8 w-8 rounded-md border border-gray-300 dark:border-zinc-700 flex items-center justify-center text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeletePage(page.id, page.name)}
                            title="Delete Status Page"
                            className="h-8 w-8 rounded-md border border-gray-300 dark:border-zinc-700 flex items-center justify-center text-gray-600 dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Chevron Toggle */}
                          <button
                            type="button"
                            onClick={() => setExpandedPageId(isExpanded ? null : page.id)}
                            title="Toggle details"
                            className="h-8 w-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Accordion Body: 3 Columns (Services, Functionalities, Subscribers) */}
                      {isExpanded && (
                        <div className="mx-6 pb-5 pt-4 border-t border-gray-200 dark:border-zinc-800">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                            {/* Column 1: Services */}
                            <div className="flex flex-col gap-2">
                              <span className="text-gray-700 dark:text-zinc-300 font-medium">
                                Services
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {page.services.map((svc) => (
                                  <span
                                    key={svc.id}
                                    className="px-2.5 py-1 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-zinc-700 rounded-full inline-flex items-center gap-2"
                                  >
                                    <span
                                      className="inline-block w-2 h-2 rounded-full shrink-0"
                                      style={{ backgroundColor: svc.color }}
                                    />
                                    <span className="truncate max-w-[140px] sm:max-w-xs">{svc.name}</span>
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Column 2: Functionalities */}
                            <div className="flex flex-col gap-2">
                              <span className="text-gray-700 dark:text-zinc-300 font-medium">
                                Functionalities
                              </span>
                              <span className="text-gray-500 dark:text-zinc-400">
                                No items under this category.
                              </span>
                            </div>

                            {/* Column 3: Subscribers */}
                            <div className="flex flex-col gap-2">
                              <span className="text-gray-700 dark:text-zinc-300 font-medium">
                                Subscribers
                              </span>
                              <div className="flex items-center">
                                <span className="px-2.5 py-1 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 rounded-full inline-flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5 text-zinc-500" />
                                  <span>{page.subscribersCount} Subscribers</span>
                                  <ArrowUpRight className="h-3 w-3 text-zinc-400" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Pagination Footer */}
              <div className="w-full bg-gray-50 dark:bg-zinc-900/60 px-4 py-3 flex items-center justify-between text-xs text-gray-700 dark:text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <span>
                    Showing <strong className="font-bold">1</strong> to{' '}
                    <strong className="font-bold">{filteredPages.length}</strong> of{' '}
                    <strong className="font-bold">{filteredPages.length}</strong>
                  </span>
                  <Pencil className="h-3 w-3 text-gray-400 ml-1" />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled
                    className="px-2 py-0.5 border border-gray-300 dark:border-zinc-700 rounded text-gray-400 opacity-50 cursor-not-allowed"
                  >
                    &lt;
                  </button>
                  <span className="px-2 py-0.5 border border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold rounded">
                    1
                  </span>
                  <button
                    type="button"
                    disabled
                    className="px-2 py-0.5 border border-gray-300 dark:border-zinc-700 rounded text-gray-400 opacity-50 cursor-not-allowed"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: NEW / EDIT STATUS PAGE BUILDER (Exact Match to media_1788783002077.png) */}
        {/* ========================================================================= */}
        {view === 'builder' && (
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-8 space-y-4">
            {/* Top Navigation Bar: Breadcrumbs + Center Tabs + Create Button */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-xs text-zinc-500">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                >
                  Home
                </button>
                <ChevronRight className="h-3 w-3 text-zinc-400" />
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                >
                  Status Pages
                </button>
                <ChevronRight className="h-3 w-3 text-zinc-400" />
                <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                  {editingPageId ? 'Edit Status Page' : 'New Status Page'}
                </span>
              </nav>

              {/* Center Configuration Tabs */}
              <div className="flex items-center gap-6 text-xs font-medium self-center">
                {(
                  [
                    { key: 'setup', label: 'Setup' },
                    { key: 'authentication', label: 'Authentication' },
                    { key: 'customize', label: 'Customize' },
                    { key: 'components', label: 'Components' },
                    { key: 'templates', label: 'Templates' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-2.5 transition-colors cursor-pointer ${
                      activeTab === tab.key
                        ? 'border-b-2 border-indigo-600 font-semibold text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Top Right Save / Create Button */}
              <button
                type="button"
                onClick={handleSaveStatusPage}
                className="bg-black text-white hover:bg-zinc-800 transition-colors rounded-lg px-4 py-1.5 text-xs font-semibold shadow-xs cursor-pointer"
              >
                {editingPageId ? 'Save Changes' : 'Create'}
              </button>
            </div>

            {/* Unsaved Changes Banner (Reactive when dirty) */}
            {isDirty && (
              <div className="rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2.5 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
                <span>
                  You have unsaved changes. The status page you are seeing is a live preview. You will need to save the form to have your changes take effect.
                </span>
              </div>
            )}

            {/* Two-Column Split Layout - ALWAYS PERSISTENT ACROSS ALL TABS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
              {/* Left Column: Form Controls (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-6 max-h-[calc(100vh-210px)] overflow-y-auto pr-2">
                {/* TAB CONTENT: SETUP */}
                {activeTab === 'setup' && (
                  <div className="space-y-6">
                    {/* Field 1: Name * */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-0.5">
                        <span>Name</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        An easy name to identify the status page internally. Customers won&apos;t see this.
                      </p>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => {
                          setFormName(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Give this status page a concise name (1-3 words)"
                        required
                        className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      />
                    </div>

                    {/* Field 2: Internal Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        Internal Description
                      </label>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        Let your team know when this page is best to update or send out to a customer.
                      </p>
                      <textarea
                        rows={3}
                        value={formDescription}
                        onChange={(e) => {
                          setFormDescription(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Write a human readable description."
                        className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-y"
                      />
                    </div>

                    {/* Field 3: Public Toggle */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={formIsPublic}
                          onClick={() => {
                            setFormIsPublic(!formIsPublic);
                            setIsDirty(true);
                          }}
                          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            formIsPublic ? 'bg-purple-600' : 'bg-gray-300 dark:bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              formIsPublic ? 'translate-x-3' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          Public
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        When this is on, anyone with a link can see this page. When this is off, only users logged into Rootly can see the page.
                      </p>
                    </div>

                    {/* Show Advanced Settings Accordion */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                        className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {showAdvancedSettings ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                        <span>{showAdvancedSettings ? 'Hide advanced settings' : 'Show advanced settings'}</span>
                      </button>

                      {showAdvancedSettings && (
                        <div className="mt-3 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 space-y-4 text-xs">
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">Allow email notifications</span>
                            <input
                              type="checkbox"
                              checked={formAllowEmail}
                              onChange={(e) => {
                                setFormAllowEmail(e.target.checked);
                                setIsDirty(true);
                              }}
                              className="rounded border-gray-300 bg-transparent text-purple-600 focus:ring-purple-500"
                            />
                          </label>

                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">Allow SMS notifications</span>
                            <input
                              type="checkbox"
                              checked={formAllowSms}
                              onChange={(e) => {
                                setFormAllowSms(e.target.checked);
                                setIsDirty(true);
                              }}
                              className="rounded border-gray-300 bg-transparent text-purple-600 focus:ring-purple-500"
                            />
                          </label>

                          <div className="space-y-1">
                            <label className="font-medium text-zinc-700 dark:text-zinc-300">External Domain Names</label>
                            <input
                              type="text"
                              value={formExternalDomain}
                              onChange={(e) => {
                                setFormExternalDomain(e.target.value);
                                setIsDirty(true);
                              }}
                              placeholder="status.yourcompany.com"
                              className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-medium text-zinc-700 dark:text-zinc-300">Google Analytics Tracking ID</label>
                            <input
                              type="text"
                              value={formGaId}
                              onChange={(e) => {
                                setFormGaId(e.target.value);
                                setIsDirty(true);
                              }}
                              placeholder="G-XXXXXXXXXX"
                              className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: AUTHENTICATION */}
                {activeTab === 'authentication' && (
                  <div className="space-y-5 text-xs">
                    {!formIsPublic ? (
                      <div className="p-3.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 leading-relaxed">
                        Authentication settings are only available for public status pages. Switch to &quot;Public&quot; in Setup to configure guest authentication.
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Access Control & Security</h3>
                          <p className="text-zinc-500 text-[11px]">
                            Choose how visitors authenticate to access this status page.
                          </p>
                        </div>

                        <div className="space-y-2.5">
                          <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 cursor-pointer">
                            <input
                              type="radio"
                              name="auth_mode"
                              checked={formAuthMethod === 'none'}
                              onChange={() => {
                                setFormAuthMethod('none');
                                setIsDirty(true);
                              }}
                              className="mt-0.5 bg-transparent"
                            />
                            <div>
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">No Authentication</div>
                              <div className="text-zinc-500 text-[11px]">Status page is publicly accessible without any credentials.</div>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 cursor-pointer">
                            <input
                              type="radio"
                              name="auth_mode"
                              checked={formAuthMethod === 'password'}
                              onChange={() => {
                                setFormAuthMethod('password');
                                setIsDirty(true);
                              }}
                              className="mt-0.5 bg-transparent"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">Password Authentication</div>
                              <div className="text-zinc-500 text-[11px]">Visitors enter a shared password to unlock access.</div>

                              {formAuthMethod === 'password' && (
                                <div className="mt-2.5 pt-2 border-t border-gray-200 dark:border-zinc-800">
                                  <input
                                    type="password"
                                    value={formAuthPassword}
                                    onChange={(e) => {
                                      setFormAuthPassword(e.target.value);
                                      setIsDirty(true);
                                    }}
                                    placeholder="Enter a secure password"
                                    className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                  />
                                </div>
                              )}
                            </div>
                          </label>

                          <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 cursor-pointer">
                            <input
                              type="radio"
                              name="auth_mode"
                              checked={formAuthMethod === 'saml'}
                              onChange={() => {
                                setFormAuthMethod('saml');
                                setIsDirty(true);
                              }}
                              className="mt-0.5 bg-transparent"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">SAML Single Sign-On</div>
                              <div className="text-zinc-500 text-[11px]">Visitors authenticate through your SAML identity provider (Okta, Azure AD).</div>

                              {formAuthMethod === 'saml' && (
                                <div className="mt-2.5 pt-2 border-t border-gray-200 dark:border-zinc-800 space-y-2">
                                  <input
                                    type="url"
                                    value={formSamlIdpUrl}
                                    onChange={(e) => {
                                      setFormSamlIdpUrl(e.target.value);
                                      setIsDirty(true);
                                    }}
                                    placeholder="IdP SSO URL (e.g. https://yourcompany.okta.com/app/...)"
                                    className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                  />
                                  <textarea
                                    rows={3}
                                    value={formSamlCert}
                                    onChange={(e) => {
                                      setFormSamlCert(e.target.value);
                                      setIsDirty(true);
                                    }}
                                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                                    className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent p-2 text-[10px] font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                  />
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB CONTENT: CUSTOMIZE (Exact Match to media_1788783002077.png)           */}
                {/* ========================================================================= */}
                {activeTab === 'customize' && (
                  <div className="space-y-6 text-xs">
                    {/* 1. Public Title */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        Public Title
                      </label>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        Help status page visitors identify the purpose of this status page. Visible on status page.
                      </p>
                      <input
                        type="text"
                        value={formPublicTitle}
                        onChange={(e) => {
                          setFormPublicTitle(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Give this status page a concise title (1-3 words)"
                        className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      />
                    </div>

                    {/* 2. Public Description */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        Public Description
                      </label>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        Describe what services this status page represents. Visible on status page.
                      </p>
                      <textarea
                        rows={3}
                        maxLength={1000}
                        value={formPublicDescription}
                        onChange={(e) => {
                          setFormPublicDescription(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Write a human readable description."
                        className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-y"
                      />
                      <div className="text-[11px] text-zinc-400">
                        {1000 - formPublicDescription.length} characters remaining
                      </div>
                    </div>

                    {/* 3. Uptime Message */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        Uptime Message
                      </label>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        This message will show on the status page{' '}
                        <strong className="text-zinc-700 dark:text-zinc-300">
                          when there are no issues or incidents with the services this status page represents.
                        </strong>
                      </p>
                      <input
                        type="text"
                        value={formUptimeMessage}
                        onChange={(e) => {
                          setFormUptimeMessage(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="All Systems Operational"
                        className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      />
                    </div>

                    {/* 4. Downtime Message */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        Downtime Message
                      </label>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        This message will show on the status page{' '}
                        <strong className="text-zinc-700 dark:text-zinc-300">
                          when there are issues or incidents with the services this status page represents.
                        </strong>
                      </p>
                      <input
                        type="text"
                        value={formDowntimeMessage}
                        onChange={(e) => {
                          setFormDowntimeMessage(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Something's not quite right"
                        className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      />
                    </div>

                    {/* 5. Logo Upload Dropzone */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        Logo
                      </label>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        The logo will display at the top left side of the status page. Size &amp; Format: 64×64 jpg, png
                      </p>
                      <label className="border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg p-5 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <Upload className="h-4 w-4 text-zinc-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          {formLogoFileName ? (
                            <strong className="text-emerald-600">{formLogoFileName}</strong>
                          ) : (
                            <>
                              <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Select a file</span> or drag and drop
                            </>
                          )}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setFormLogoFileName(e.target.files[0].name);
                              setIsDirty(true);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* 6. Favicon Upload Dropzone */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        Favicon
                      </label>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        This is the icon that shows up in a site tab when users visit this page. Size &amp; Format: 64×64 jpg, png
                      </p>
                      <label className="border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <Upload className="h-4 w-4 text-zinc-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          {formFaviconFileName ? (
                            <strong className="text-emerald-600">{formFaviconFileName}</strong>
                          ) : (
                            <>
                              <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Select a file</span> or drag and drop
                            </>
                          )}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/x-icon"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setFormFaviconFileName(e.target.files[0].name);
                              setIsDirty(true);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* 7. Open Graph Image Upload Dropzone */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        Open Graph Image
                      </label>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        This is the image that will show in website previews when shared. Size &amp; Format: 1200×630 jpg, png
                      </p>
                      <label className="border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <Upload className="h-4 w-4 text-zinc-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          {formOgImageFileName ? (
                            <strong className="text-emerald-600">{formOgImageFileName}</strong>
                          ) : (
                            <>
                              <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Select a file</span> or drag and drop
                            </>
                          )}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setFormOgImageFileName(e.target.files[0].name);
                              setIsDirty(true);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* 8. Website URL */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        Website URL
                      </label>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        Link users to your company’s website. This will be displayed in the status page footer.
                      </p>
                      <input
                        type="url"
                        value={formWebsiteUrl}
                        onChange={(e) => {
                          setFormWebsiteUrl(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Company’s website URL"
                        className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      />
                    </div>

                    {/* 9. Website Support URL */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        Website Support URL
                      </label>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        Link users to your company’s support page. This will be displayed in the status page footer.
                      </p>
                      <input
                        type="url"
                        value={formSupportUrl}
                        onChange={(e) => {
                          setFormSupportUrl(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Company’s support page URL"
                        className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      />
                    </div>

                    {/* 10. Website Privacy URL */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        Website Privacy URL
                      </label>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        Link users to your company’s privacy policy page. This will be displayed in the footer.
                      </p>
                      <input
                        type="url"
                        value={formPrivacyUrl}
                        onChange={(e) => {
                          setFormPrivacyUrl(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Company’s privacy page URL"
                        className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      />
                    </div>

                    {/* 11. Timezone */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        Timezone
                      </label>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        Set the timezone to show when the status changes occurred.
                      </p>
                      <select
                        value={formTimezone}
                        onChange={(e) => {
                          setFormTimezone(e.target.value);
                          setIsDirty(true);
                        }}
                        className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      >
                        <option value="(GMT-07:00) Pacific Time (US & Canada)" className="dark:bg-zinc-900">
                          (GMT-07:00) Pacific Time (US & Canada)
                        </option>
                        <option value="(GMT-04:00) Eastern Time (US & Canada)" className="dark:bg-zinc-900">
                          (GMT-04:00) Eastern Time (US & Canada)
                        </option>
                        <option value="(GMT+00:00) UTC" className="dark:bg-zinc-900">
                          (GMT+00:00) UTC
                        </option>
                        <option value="(GMT+01:00) London, Dublin" className="dark:bg-zinc-900">
                          (GMT+01:00) London, Dublin
                        </option>
                        <option value="(GMT+05:30) Mumbai, New Delhi" className="dark:bg-zinc-900">
                          (GMT+05:30) Mumbai, New Delhi
                        </option>
                      </select>
                    </div>

                    {/* 12. Section Order */}
                    <div className="space-y-1.5 pt-1">
                      <label className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        Section Order
                      </label>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        Drag and drop to reorder how sections appear on your public status page.
                      </p>
                      <div className="space-y-2 pt-1">
                        {sectionOrder.map((section, idx) => (
                          <div
                            key={section.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <GripVertical className="h-4 w-4 text-zinc-400 cursor-grab" />
                              {section.id === 'maint' && <Wrench className="h-4 w-4 text-zinc-500" />}
                              {section.id === 'status' && <Server className="h-4 w-4 text-zinc-500" />}
                              {section.id === 'incidents' && <AlertTriangle className="h-4 w-4 text-zinc-500" />}
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {section.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveSection(idx, 'up')}
                                  className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 cursor-pointer"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === sectionOrder.length - 1}
                                  onClick={() => handleMoveSection(idx, 'down')}
                                  className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 cursor-pointer"
                                >
                                  ▼
                                </button>
                              </div>
                              <span className="h-6 w-6 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[11px] text-zinc-700 dark:text-zinc-300">
                                {section.order}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: COMPONENTS */}
                {activeTab === 'components' && (
                  <div className="space-y-5 text-xs">
                    <div className="p-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formShowUptime}
                          onChange={(e) => {
                            setFormShowUptime(e.target.checked);
                            setIsDirty(true);
                          }}
                          className="rounded border-gray-300 bg-transparent text-purple-600"
                        />
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          Display historical uptime over
                        </span>
                      </div>
                      <select
                        value={formUptimeDurationDays}
                        onChange={(e) => {
                          setFormUptimeDurationDays(Number(e.target.value));
                          setIsDirty(true);
                        }}
                        className="rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-xs"
                      >
                        <option value={30}>30 days</option>
                        <option value={60}>60 days</option>
                        <option value={90}>90 days</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">Services Included</span>
                        <span className="text-[11px] text-zinc-400">3 of 3 Active</span>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                        {[
                          { name: '[Demo] API - Authentication', color: '#FAEBB7' },
                          { name: '[Demo] DB - Production Database', color: '#F4CFD1' },
                          { name: '[Demo] UI - User Profile Block', color: '#D7E7F5' },
                        ].map((s, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                              <span className="font-medium text-zinc-800 dark:text-zinc-200">{s.name}</span>
                            </div>
                            <span className="text-emerald-600 font-semibold text-[11px] inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Operational
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: TEMPLATES */}
                {activeTab === 'templates' && (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTemplateSubTab('incident')}
                          className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                            templateSubTab === 'incident'
                              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                              : 'text-zinc-500 hover:text-zinc-900'
                          }`}
                        >
                          Incident Templates
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateSubTab('maintenance')}
                          className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                            templateSubTab === 'maintenance'
                              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                              : 'text-zinc-500 hover:text-zinc-900'
                          }`}
                        >
                          Maintenance Templates
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert('New template dialog')}
                        className="px-2.5 py-1 text-xs border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50"
                      >
                        + Add
                      </button>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <div className="p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 space-y-1">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                          <span>Investigating Service Degradation</span>
                          <span className="text-emerald-600 text-[10px] font-semibold">Enabled</span>
                        </div>
                        <p className="text-zinc-500 text-[11px]">
                          &quot;We are currently investigating elevated latency affecting regional endpoints. Next update in 20 minutes.&quot;
                        </p>
                      </div>

                      <div className="p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 space-y-1">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                          <span>Scheduled Database Maintenance</span>
                          <span className="text-emerald-600 text-[10px] font-semibold">Enabled</span>
                        </div>
                        <p className="text-zinc-500 text-[11px]">
                          &quot;Routine maintenance scheduled on production database read replicas. No downtime anticipated.&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* Right Column: Live Interactive Browser Mockup (lg:col-span-7)              */}
              {/* PERSISTENT ACROSS ALL TABS (Exact Match to media_1788783002077.png)        */}
              {/* ========================================================================= */}
              <div className="lg:col-span-7 sticky top-4">
                <div className="rounded-2xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
                  {/* Browser Window Chrome */}
                  <div className="bg-gray-100 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80 inline-block" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 inline-block" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 inline-block" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {formExternalDomain || 'status.knotic.io'}
                    </span>
                    <div className="w-8" />
                  </div>

                  {/* Public Status Page Simulated Canvas */}
                  <div className="p-8 sm:p-12 space-y-8 bg-white dark:bg-zinc-900 min-h-[500px] flex flex-col justify-between">
                    <div className="space-y-8">
                      {/* Org Header */}
                      <div className="flex items-center justify-center pt-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                            {formPublicTitle || brandOrgName}
                          </span>
                        </div>
                      </div>

                      {/* Status Hero Card (Soft Green Card with Centered Checkmark) */}
                      <div className="rounded-2xl bg-[#E8F8F0] dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 p-10 flex flex-col items-center justify-center text-center space-y-3 max-w-lg mx-auto shadow-2xs">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <Check className="h-7 w-7 stroke-[2.5]" />
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800 dark:text-emerald-300 tracking-tight">
                          {formUptimeMessage || 'All Systems Operational'}
                        </h2>

                        <a
                          href="#incident-history"
                          onClick={(e) => e.preventDefault()}
                          className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 pt-1"
                        >
                          <span>Incident History</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    {/* Footer in Mockup */}
                    <div className="pt-8 text-center text-xs text-zinc-400 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-center gap-1.5">
                      <span>Powered by</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                        rootly ai
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ========================================================================= */}
        {/* PUBLIC STATUS PAGE MODAL PREVIEW (Activated by ((•)) View ↗)               */}
        {/* ========================================================================= */}
        {isPublicPreviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-900/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
              {/* Modal Top Bar */}
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs z-10">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Public Status Page Preview: {statusPages[0]?.name}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    ({statusPages[0]?.subdomain})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublicPreviewModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Public Page Simulation Canvas */}
              <div className="p-8 sm:p-12 space-y-8 flex-1">
                {/* Org Logo & Name */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-zinc-800 dark:text-zinc-200" />
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {statusPages[0]?.publicTitle || brandOrgName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Subscribed to status notifications!')}
                    className="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    Subscribe to Updates
                  </button>
                </div>

                {/* Status Hero Card */}
                <div className="rounded-2xl bg-[#E8F8F0] dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check className="h-7 w-7 stroke-[2.5]" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800 dark:text-emerald-300 tracking-tight">
                    {statusPages[0]?.uptimeMessage || 'All Systems Operational'}
                  </h2>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    All global endpoints, services, and processing pipelines operating normally.
                  </p>
                </div>

                {/* Services List */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    System Services
                  </h3>
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                    {statusPages[0]?.services.map((svc) => (
                      <div key={svc.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: svc.color }}
                          />
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{svc.name}</span>
                        </div>
                        <span className="font-semibold text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Operational
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Incident History Link */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <span>Incident History Archive (Past 90 Days)</span>
                  <span className="font-bold text-zinc-600 dark:text-zinc-300">
                    Powered by rootly ai
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={isCreateIncidentOpen}
        onClose={() => setIsCreateIncidentOpen(false)}
      />
    </div>
  );
}
