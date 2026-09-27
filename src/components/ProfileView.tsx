import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Award, 
  Target, 
  Calendar, 
  CheckCircle2, 
  PlayCircle, 
  History, 
  BarChart3, 
  Edit3, 
  Save, 
  ShieldCheck,
  TrendingUp,
  FileText,
  Database,
  Settings,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  UserProfile, 
  TestAttempt, 
  QuestionBank, 
  MarkingSchemeConfig, 
  Question 
} from '../types';
import { QuestionBankView } from './QuestionBankView';
import { HistoryView } from './HistoryView';
import { AnalyticsView } from './AnalyticsView';
import { AdminSettingsView } from './AdminSettingsView';

export type ProfileSubTab = 'overview' | 'question-banks' | 'history' | 'analytics' | 'admin';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  attempts: TestAttempt[];
  questionBanks: QuestionBank[];
  markingScheme: MarkingSchemeConfig;
  activeSubTab?: ProfileSubTab;
  onChangeSubTab?: (tab: ProfileSubTab) => void;
  onStartTest: (bankId?: string) => void;
  onAddQuestionBank: (newBank: QuestionBank) => void;
  onDeleteQuestionBank: (bankId: string) => void;
  onViewAttempt: (attempt: TestAttempt) => void;
  onDeleteAttempt: (attemptId: string) => void;
  onClearAllAttempts: () => void;
  onUpdateMarkingScheme: (newConfig: MarkingSchemeConfig) => void;
  onAddQuestionToBank: (bankId: string, question: Question) => void;
  onRestoreDefaultBank: () => void;
  selectedAttemptForReview?: TestAttempt | null;

}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  attempts,
  questionBanks,
  markingScheme,
  activeSubTab = 'overview',
  onChangeSubTab,
  onStartTest,
  onAddQuestionBank,
  onDeleteQuestionBank,
  onViewAttempt,
  onDeleteAttempt,
  onClearAllAttempts,
  onUpdateMarkingScheme,
  onAddQuestionToBank,
  onRestoreDefaultBank,
  selectedAttemptForReview,
  
}) => {
  const [localSubTab, setLocalSubTab] = useState<ProfileSubTab>(activeSubTab);
  const currentTab = onChangeSubTab ? activeSubTab : localSubTab;

  const handleTabChange = (tab: ProfileSubTab) => {
    if (onChangeSubTab) {
      onChangeSubTab(tab);
    } else {
      setLocalSubTab(tab);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [savedNotice, setSavedNotice] = useState(false);

  // Compute stats
  const totalAttempts = attempts.length;
  const bestScore = attempts.length > 0 
    ? Math.max(...attempts.map(a => a.score)) 
    : 0;
  const avgAccuracy = attempts.length > 0 
    ? Math.round(attempts.reduce((acc, curr) => acc + curr.accuracy, 0) / attempts.length) 
    : 0;
  const avgScore = attempts.length > 0 
    ? Math.round(attempts.reduce((acc, curr) => acc + curr.score, 0) / attempts.length) 
    : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsEditing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'TR';
  };

  const targetProgress = Math.min(100, Math.round((bestScore / (formData.targetScore || 80)) * 100));

  const navItems = [
    { id: 'overview' as ProfileSubTab, label: 'Profile Overview', icon: User, badge: null },
    { id: 'question-banks' as ProfileSubTab, label: 'Question Banks', icon: Database, badge: questionBanks.length },
    { id: 'history' as ProfileSubTab, label: 'Test History', icon: History, badge: attempts.length },
    { id: 'analytics' as ProfileSubTab, label: 'Analytics', icon: BarChart3, badge: null },
    { id: 'admin' as ProfileSubTab, label: 'Admin Settings', icon: Settings, badge: null },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner / Toast */}
      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">Candidate profile successfully updated and saved!</span>
        </div>
      )}

      {/* Profile Hub Header with Integrated Sub-Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Top Candidate Bar */}
        <div className="p-6 sm:p-7 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 via-blue-500 to-sky-400 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg ring-4 ring-white/10">
                  {getInitials(profile.name)}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-slate-900 text-white p-0.5 rounded-full shadow" title="Active Aspirant">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{profile.name}</h1>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Aspirant
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profile.email}
                  <span className="text-slate-500">•</span>
                  <span>Roll: {profile.rollNumber}</span>
                </p>
                <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-slate-200">
                    {profile.targetExam}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    Category: {profile.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onStartTest()}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition"
              >
                <PlayCircle className="w-4 h-4" />
                Start Mock Test
              </button>

            </div>
          </div>
        </div>

        {/* Profile Tabs Navigation (Housing Question Banks, History, Analytics, Admin) */}
        <div className="flex items-center overflow-x-auto px-4 sm:px-6 bg-slate-50 border-b border-slate-200 scrollbar-none gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-white font-semibold shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtab 1: Profile Overview */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          {/* Google Account Authentication Status Card */}

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tests Taken</span>
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{totalAttempts}</div>
              <p className="text-xs text-slate-500 mt-1">Completed mock sessions</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Highest Score</span>
                <Award className="w-5 h-5 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{bestScore}</div>
              <p className="text-xs text-slate-500 mt-1">Target Score: {formData.targetScore || 200}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Score</span>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{avgScore}</div>
              <p className="text-xs text-slate-500 mt-1">Across all attempts</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accuracy Rate</span>
                <Target className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{avgAccuracy}%</div>
              <p className="text-xs text-slate-500 mt-1">Overall correctness</p>
            </div>
          </div>

          {/* Target Score Progress Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Target Score Milestone</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {targetProgress}% of target achieved
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, targetProgress)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Current Best: {bestScore} marks</span>
              <span>Target Score: {formData.targetScore || 80} marks</span>
            </div>
          </div>

          {/* Candidate Information Card & Edit Form */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Candidate Information
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Details used for mock test scorecards and reports</p>
              </div>
              <button
                onClick={() => {
                  setFormData(profile);
                  setIsEditing(!isEditing);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                {isEditing ? 'Cancel' : 'Edit Info'}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Roll / Application Number</label>
                    <input
                      type="text"
                      value={formData.rollNumber}
                      onChange={e => setFormData({ ...formData, rollNumber: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Target Exam & Subject</label>
                    <input
                      type="text"
                      value={formData.targetExam}
                      onChange={e => setFormData({ ...formData, targetExam: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="General">General / Unreserved</option>
                      <option value="OBC-NCL">OBC-NCL</option>
                      <option value="EWS">GEN-EWS</option>
                      <option value="SC">Scheduled Caste (SC)</option>
                      <option value="ST">Scheduled Tribe (ST)</option>
                      <option value="PwD">Person with Benchmark Disability (PwD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Target Score (out of 100)</label>
                    <input
                      type="number"
                      min="40"
                      max="100"
                      value={formData.targetScore}
                      onChange={e => setFormData({ ...formData, targetScore: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-sm">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Candidate Name</span>
                  <span className="font-semibold text-slate-900">{profile.name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Registered Email</span>
                  <span className="font-semibold text-slate-900">{profile.email}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Application / Roll No</span>
                  <span className="font-semibold font-mono text-slate-900">{profile.rollNumber}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Target Examination</span>
                  <span className="font-semibold text-slate-900">{profile.targetExam}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Reservation Category</span>
                  <span className="font-semibold text-slate-900">{profile.category}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Target Score Goal</span>
                  <span className="font-semibold text-blue-600">{profile.targetScore || 80} / 100 Marks</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Profile Shortcuts to Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleTabChange('question-banks')}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Question Banks</h4>
                <p className="text-xs text-slate-500 mt-0.5">{questionBanks.length} banks available for testing</p>
              </div>
            </button>

            <button
              onClick={() => handleTabChange('history')}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Test History</h4>
                <p className="text-xs text-slate-500 mt-0.5">{attempts.length} past mock test attempts recorded</p>
              </div>
            </button>

            <button
              onClick={() => handleTabChange('analytics')}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Performance Analytics</h4>
                <p className="text-xs text-slate-500 mt-0.5">Unit-wise strength and weak area metrics</p>
              </div>
            </button>

            <button
              onClick={() => handleTabChange('admin')}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Admin Settings</h4>
                <p className="text-xs text-slate-500 mt-0.5">Marking schemes, timing, & manual questions</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Subtab 2: Question Banks Component inside Profile */}
      {currentTab === 'question-banks' && (
        <QuestionBankView
          questionBanks={questionBanks}
          onAddQuestionBank={onAddQuestionBank}
          onDeleteQuestionBank={onDeleteQuestionBank}
          onStartTestWithBank={(bankId) => onStartTest(bankId)}
        />
      )}

      {/* Subtab 3: Test History Component inside Profile */}
      {currentTab === 'history' && (
        <HistoryView
          attempts={attempts}
          onViewAttempt={onViewAttempt}
          onDeleteAttempt={onDeleteAttempt}
          onClearAll={onClearAllAttempts}
          onStartNewTest={() => onStartTest()}
        />
      )}

      {/* Subtab 4: Performance Analytics Component inside Profile */}
      {currentTab === 'analytics' && (
        <AnalyticsView
          currentAttempt={selectedAttemptForReview || (attempts.length > 0 ? attempts[0] : undefined)}
          allAttempts={attempts}
        />
      )}

      {/* Subtab 5: Admin Settings Component inside Profile */}
      {currentTab === 'admin' && (
        <AdminSettingsView
          markingScheme={markingScheme}
          onUpdateMarkingScheme={onUpdateMarkingScheme}
          questionBanks={questionBanks}
          onAddQuestionToBank={onAddQuestionToBank}
          onRestoreDefaultBank={onRestoreDefaultBank}
        />
      )}
    </div>
  );
};
