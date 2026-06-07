import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMISStore } from './store';

// Mock firebase module to prevent live network calls during tests
vi.mock('./firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-id', email: 'appointyview@appointy.com' }
  },
  db: {},
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn()
}));

describe('Appointy MIS Portal - Secure RBAC & Session Unit Tests', () => {
  beforeEach(() => {
    // Reset store to default view state before each test
    const store = useMISStore.getState();
    store.setUserRole('view');
    store.setUserEmail('appointyview@appointy.com');
  });

  describe('Role-Based Access Control (RBAC) Permission Tests', () => {
    it('should initialize with the view-only permission role', () => {
      const state = useMISStore.getState();
      expect(state.userRole).toBe('view');
      expect(state.userEmail).toBe('appointyview@appointy.com');
    });

    it('should block revenue category additions for the VIEW (view-only) role with an authorization error', () => {
      const store = useMISStore.getState();
      expect(() => {
        store.addRevenueCategory('Premium Enterprise Integration', null);
      }).toThrow(/Unauthorized Operation: Role 'view' cannot execute 'addRevenueCategory'/);
    });

    it('should block operating expense additions for the VIEW (view-only) role with an authorization error', () => {
      const store = useMISStore.getState();
      expect(() => {
        store.addExpenseCategory('Unsolicited Feature Expenses', null);
      }).toThrow(/Unauthorized Operation: Role 'view' cannot execute 'addExpenseCategory'/);
    });

    it('should block cell financial modifications for the VIEW (view-only) role with an authorization error', () => {
      const store = useMISStore.getState();
      expect(() => {
        store.updateRevenueValue('rev-enterprise', 'Jan 25', 150000);
      }).toThrow(/Unauthorized Operation: Role 'view' cannot execute 'updateRevenueValue'/);
    });

    it('should block monthly addition operations for the VIEW (view-only) role with an authorization error', () => {
      const store = useMISStore.getState();
      expect(() => {
        store.addMonth('Jan 26');
      }).toThrow(/Unauthorized Operation: Role 'view' cannot execute 'addMonth'/);
    });

    it('should permit state modifications once the role is upgraded to EDIT (full edit)', () => {
      // Elevate privileges to Editor
      useMISStore.getState().setUserRole('edit');
      useMISStore.getState().setUserEmail('appointyedit@appointy.com');
      expect(useMISStore.getState().userRole).toBe('edit');

      // Attempt mutating actions as an editor
      expect(() => {
        useMISStore.getState().addRevenueCategory('Enterprise Level A', null);
      }).not.toThrow();

      expect(() => {
        useMISStore.getState().addExpenseCategory('Staff Salaries', null);
      }).not.toThrow();
    });
  });

  describe('Session Inactivity Timeout Range Tests', () => {
    it('should satisfy threshold equations of the inactivity timer', () => {
      const nineMinutes = 9 * 60; // 540s
      const tenMinutes = 10 * 60; // 600s

      const testInactivitySec = (elapsedSec: number) => {
        const isWarningActive = elapsedSec >= nineMinutes && elapsedSec < tenMinutes;
        const isLogoutActive = elapsedSec >= tenMinutes;
        const countdownSeconds = isWarningActive ? tenMinutes - elapsedSec : 60;

        return { isWarningActive, isLogoutActive, countdownSeconds };
      };

      // Scenario A: Under 9 Minutes Inactive (Safe Workspace)
      const underThreshold = testInactivitySec(120); // 2 minutes
      expect(underThreshold.isWarningActive).toBe(false);
      expect(underThreshold.isLogoutActive).toBe(false);

      // Scenario B: Exactly 9 Minutes Inactive (Modal active with 1-min countdown)
      const warningThreshold = testInactivitySec(540); 
      expect(warningThreshold.isWarningActive).toBe(true);
      expect(warningThreshold.isLogoutActive).toBe(false);
      expect(warningThreshold.countdownSeconds).toBe(60);

      // Scenario C: 9.5 Minutes Inactive (Modal active with 30s countdown)
      const warningMidway = testInactivitySec(570);
      expect(warningMidway.isWarningActive).toBe(true);
      expect(warningMidway.isLogoutActive).toBe(false);
      expect(warningMidway.countdownSeconds).toBe(30);

      // Scenario D: 10 Minutes Inactive (Logout triggered, warning dismissed)
      const logoutThreshold = testInactivitySec(600);
      expect(logoutThreshold.isWarningActive).toBe(false);
      expect(logoutThreshold.isLogoutActive).toBe(true);
    });
  });
});
