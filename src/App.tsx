/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabaseClient'; // ADDED: Live database connection
import { 
  saveQuestionBanks, 
  loadTestAttempts, 
  saveTestAttempt, 
  deleteTestAttempt, 
  clearAllTestAttempts, 
  loadActiveTestSession, 
  saveActiveTestSession, 
  clearActiveTestSession, 
  loadMarkingScheme, 
  saveMarkingScheme,
  resetToDefaultBanks,
  loadUserProfile,
  saveUserProfile,
  loadAuthUser,
  saveAuthUser
} from './utils/storage';
import { 
  QuestionBank, 
  TestAttempt, 
  ActiveTestSession, 
  MarkingSchemeConfig, 
  Question,
  UserProfile,
  AuthUser
} from './types';
import { generateTestQuestions, evaluateTest } from './utils/testEngine';

import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { StartTestSetup } from './components/StartTestSetup';
import { ExamInterface } from './components/ExamInterface';
import { ResultView } from './components/ResultView';
import { ProfileView, ProfileSubTab } from './components/ProfileView';
import { GoogleAuthModal } from './components/GoogleAuthModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>('overview');
  
  // CHANGED: Start with an empty list instead of local storage
  const [questionBanks, setQuestionBanks] = useState<any[]>([]); 
  
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>(() => loadTestAttempts());
  const [activeSession, setActiveSession] = useState<ActiveTestSession | null>(() => loadActiveTestSession());
  const [markingScheme, setMarkingScheme] = useState<MarkingSchemeConfig>(() => loadMarkingScheme());
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadUserProfile());
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => loadAuthUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const [selectedAttemptForReview, setSelectedAttemptForReview] = useState<TestAttempt | null>(null);
  const [targetBankIdForSetup, setTargetBankIdForSetup] = useState<string | undefined>(undefined);

  // ADDED: Fetch globally from Supabase on app load
  useEffect(() => {
    const fetchLiveDatabase = async () => {
      const { data, error } = await supabase
        .from('question_banks')
        .select('*, questions(*)') // Pulls the banks AND their nested 50 questions
        .order('created_at', { ascending: false });

      if (data) {
        setQuestionBanks(data);
      } else if (error) {
        console.error('Error fetching live Supabase data:', error);
      }
    };

    fetchLiveDatabase();
  }, []);

  // Crash recovery / Reload detection
  useEffect(() => {
    if (activeSession) {
      if (activeSession.remaining_seconds <= 0) {
        finalizeExam(activeSession);
      }
    }
  }, []);

  const handleStartTest = (bankId: string) => {
    const bank = questionBanks.find(b => b.id === bankId);
    if (!bank) return;

    if (bank.questions.length < 50) {
      alert(`This question bank has only ${bank.questions.length} questions. Exactly 50 questions are required to start a UGC-NET mock test.`);
      return;
    }

    try {
      const questions50 = generateTestQuestions(bank, 50);
      const newSession: ActiveTestSession = {
        id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        question_bank_id: bank.id,
        question_bank_name: bank.name,
        started_at: Date.now(),
        duration_seconds: markingScheme.test_duration_minutes * 60,
        remaining_seconds: markingScheme.test_duration_minutes * 60,
        current_index: 0,
        attempt_questions: questions50,
        marks_per_correct: markingScheme.marks_per_correct,
        negative_marks_per_incorrect: markingScheme.negative_marks_per_incorrect,
        last_tick_timestamp: Date.now(),
      };

      saveActiveTestSession(newSession);
      setActiveSession(newSession);
      setCurrentTab('exam');
    } catch (err: any) {
      alert(`Failed to start test: ${err.message}`);
    }
  };

  const handleUpdateSession = (updated: ActiveTestSession) => {
    setActiveSession(updated);
    saveActiveTestSession(updated);
  };

  const finalizeExam = (sessionToFinalize: ActiveTestSession) => {
    const totalTimeUsed = Math.max(1, sessionToFinalize.duration_seconds - sessionToFinalize.remaining_seconds);
    const completedAttempt = evaluateTest(
      sessionToFinalize.attempt_questions,
      sessionToFinalize.question_bank_id,
      sessionToFinalize.question_bank_name,
      new Date(sessionToFinalize.started_at).toISOString(),
      totalTimeUsed,
      {
        marks_per_correct: sessionToFinalize.marks_per_correct,
        negative_marks_per_incorrect: sessionToFinalize.negative_marks_per_incorrect,
        test_duration_minutes: Math.round(sessionToFinalize.duration_seconds / 60),
        questions_per_test: 50,
      }
    );

    saveTestAttempt(completedAttempt);
    setTestAttempts(prev => [completedAttempt, ...prev.filter(a => a.id !== completedAttempt.id)]);

    clearActiveTestSession();
    setActiveSession(null);

    setSelectedAttemptForReview(completedAttempt);
    setCurrentTab('result');
  };

  const handleDiscardActiveTest = () => {
    if (confirm('Are you sure you want to discard your current mock test in progress? Unsaved answers will be lost.')) {
      clearActiveTestSession();
      setActiveSession(null);
      if (currentTab === 'exam') {
        setCurrentTab('dashboard');
      }
    }
  };

  const handleAddQuestionBank = (newBank: QuestionBank) => {
    const updated = [newBank, ...questionBanks];
    setQuestionBanks(updated);
    saveQuestionBanks(updated);
  };

  const handleDeleteQuestionBank = (bankId: string) => {
    if (confirm('Delete this question bank? This will not affect completed test attempts.')) {
      const updated = questionBanks.filter(b => b.id !== bankId);
      setQuestionBanks(updated);
      saveQuestionBanks(updated);
    }
  };

  const handleAddQuestionToBank = (bankId: string, question: Question) => {
    const updated = questionBanks.map(b => {
      if (b.id === bankId) {
        const questions = [...b.questions, question];
        return {
          ...b,
          question_count: questions.length,
          questions,
        };
      }
      return b;
    });
    setQuestionBanks(updated);
    saveQuestionBanks(updated);
  };

  const handleRestoreDefaultBank = () => {
    const defaultList = resetToDefaultBanks();
    setQuestionBanks(defaultList);
    alert('Default UGC-NET Paper I standard question bank successfully reloaded!');
  };

  const handleUpdateMarkingScheme = (newConfig: MarkingSchemeConfig) => {
    setMarkingScheme(newConfig);
    saveMarkingScheme(newConfig);
  };

  const handleViewAttemptResults = (attempt: TestAttempt) => {
    setSelectedAttemptForReview(attempt);
    setCurrentTab('result');
  };

  const handleDeleteAttempt = (attemptId: string) => {
    if (confirm('Delete this historical test attempt?')) {
      deleteTestAttempt(attemptId);
      setTestAttempts(prev => prev.filter(a => a.id !== attemptId));
    }
  };

  const handleClearAllAttempts = () => {
    clearAllTestAttempts();
    setTestAttempts([]);
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    saveUserProfile(updated);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    saveAuthUser(user);
    setUserProfile(prev => {
      const updated = {
        ...prev,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      };
      saveUserProfile(updated);
      return updated;
    });
  };

  const handleLogout = () => {
    if (confirm('Log out of your Google Account? You can sign back in anytime.')) {
      const loggedOutUser: AuthUser = {
        id: '',
        name: 'Guest Candidate',
        email: '',
        isLoggedIn: false,
        provider: 'google',
      };
      setAuthUser(loggedOutUser);
      saveAuthUser(loggedOutUser);
      setUserProfile(prev => {
        const updated = {
          ...prev,
          name: 'Guest Candidate',
          email: '',
        };
        saveUserProfile(updated);
        return updated;
      });
    }
  };

  const handleSelectTab = (tab: string, subTab?: string) => {
    if (tab === 'start-test') {
      setTargetBankIdForSetup(undefined);
      setCurrentTab('start-test');
    } else if (['question-banks', 'history', 'analytics', 'admin'].includes(tab)) {
      setProfileSubTab(tab as ProfileSubTab);
      setCurrentTab('profile');
    } else if (tab === 'profile') {
      if (subTab) {
        setProfileSubTab(subTab as ProfileSubTab);
      }
      setCurrentTab('profile');
    } else {
      setCurrentTab(tab);
    }
  };

  const isProfileTabActive = currentTab === 'profile' || ['question-banks', 'history', 'analytics', 'admin'].includes(currentTab);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col selection:bg-blue-200">
      {currentTab !== 'exam' && (
        <Header
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          activeSession={activeSession}
          onResumeActiveTest={() => setCurrentTab('exam')}
          onDiscardActiveTest={handleDiscardActiveTest}
          candidateName={userProfile.name}
          candidateEmail={authUser?.email || userProfile.email}
          activeProfileSubTab={profileSubTab}
          isLoggedIn={authUser?.isLoggedIn ?? false}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            questionBanks={questionBanks}
            testAttempts={testAttempts}
            onStartTest={(bankId) => {
              setTargetBankIdForSetup(bankId);
              setCurrentTab('start-test');
            }}
            onNavigateTab={handleSelectTab}
            onViewAttemptResults={handleViewAttemptResults}
            onDeleteBank={handleDeleteQuestionBank}
          />
        )}

        {currentTab === 'start-test' && (
          <StartTestSetup
            questionBanks={questionBanks}
            initialBankId={targetBankIdForSetup}
            markingScheme={markingScheme}
            onBeginTest={handleStartTest}
            onCancel={() => setCurrentTab('dashboard')}
            onUploadRedirect={() => handleSelectTab('question-banks')}
          />
        )}

        {currentTab === 'exam' && activeSession && (
          <ExamInterface
            session={activeSession}
            onUpdateSession={handleUpdateSession}
            onSubmitTest={finalizeExam}
          />
        )}

        {currentTab === 'result' && selectedAttemptForReview && (
          <ResultView
            attempt={selectedAttemptForReview}
            allAttempts={testAttempts}
            onRetakeTest={(bankId) => {
              setTargetBankIdForSetup(bankId);
              setCurrentTab('start-test');
            }}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {isProfileTabActive && (
          <ProfileView
            profile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            attempts={testAttempts}
            questionBanks={questionBanks}
            markingScheme={markingScheme}
            activeSubTab={profileSubTab}
            onChangeSubTab={(newSubTab) => setProfileSubTab(newSubTab)}
            onStartTest={(bankId) => {
              setTargetBankIdForSetup(bankId);
              setCurrentTab('start-test');
            }}
            onAddQuestionBank={handleAddQuestionBank}
            onDeleteQuestionBank={handleDeleteQuestionBank}
            onViewAttempt={handleViewAttemptResults}
            onDeleteAttempt={handleDeleteAttempt}
            onClearAllAttempts={handleClearAllAttempts}
            onUpdateMarkingScheme={handleUpdateMarkingScheme}
            onAddQuestionToBank={handleAddQuestionToBank}
            onRestoreDefaultBank={handleRestoreDefaultBank}
            selectedAttemptForReview={selectedAttemptForReview}
            isLoggedIn={authUser?.isLoggedIn ?? false}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onLogout={handleLogout}
          />
        )}
      </main>

      <GoogleAuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
        defaultEmail={userProfile.email || 'TridevRuidas@gmail.com'}
        defaultName={userProfile.name || 'Tridev Ruidas'}
      />
    </div>
  );
}