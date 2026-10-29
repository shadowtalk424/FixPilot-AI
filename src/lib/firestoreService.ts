import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import { InvestigationData, ProjectData, UserProfileData, StructuredAnalysisResult } from '../types/investigation.ts';

// Helper to sanitize undefined values before writing to Firestore
function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

// Convert Firestore Timestamps to ISO strings for application state
function formatTimestamp(val: any): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  if (val.toDate && typeof val.toDate === 'function') return val.toDate().toISOString();
  return new Date().toISOString();
}

// ================= USER OPERATIONS =================

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      tier: data.tier || 'free',
      dailyAnalysisLimit: data.dailyAnalysisLimit ?? 25,
      analysesUsedToday: data.analysesUsedToday ?? 0,
      createdAt: formatTimestamp(data.createdAt),
      updatedAt: formatTimestamp(data.updatedAt),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function createOrUpdateUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<UserProfileData> {
  const path = `users/${user.uid}`;
  try {
    const existing = await getUserProfile(user.uid);
    if (existing) {
      // Update basic profile details
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: user.displayName || existing.displayName || 'Developer',
        photoURL: user.photoURL || existing.photoURL || '',
        updatedAt: serverTimestamp(),
      });
      return {
        ...existing,
        displayName: user.displayName || existing.displayName || 'Developer',
        photoURL: user.photoURL || existing.photoURL || '',
      };
    }

    const newProfile = {
      userId: user.uid,
      email: user.email || 'user@fixpilot.local',
      displayName: user.displayName || 'Developer',
      photoURL: user.photoURL || '',
      tier: 'free',
      dailyAnalysisLimit: 25,
      analysesUsedToday: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), cleanObject(newProfile));

    return {
      userId: user.uid,
      email: newProfile.email,
      displayName: newProfile.displayName,
      photoURL: newProfile.photoURL,
      tier: 'free',
      dailyAnalysisLimit: 25,
      analysesUsedToday: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function incrementUserDailyUsage(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return;
    await updateDoc(doc(db, 'users', userId), {
      analysesUsedToday: (profile.analysesUsedToday || 0) + 1,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// ================= PROJECT OPERATIONS =================

export async function listUserProjects(userId: string): Promise<ProjectData[]> {
  const path = 'projects';
  try {
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list: ProjectData[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: data.id || d.id,
        userId: data.userId,
        name: data.name,
        description: data.description || '',
        defaultLanguage: data.defaultLanguage || 'TypeScript',
        defaultFramework: data.defaultFramework || '',
        defaultEnvironment: data.defaultEnvironment || 'development',
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
      });
    });
    // Sort descending by createdAt
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function createProject(
  userId: string,
  data: {
    name: string;
    description?: string;
    defaultLanguage: string;
    defaultFramework?: string;
    defaultEnvironment?: string;
  }
): Promise<ProjectData> {
  const id = `prj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `projects/${id}`;

  try {
    const payload = cleanObject({
      id,
      userId,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      defaultLanguage: data.defaultLanguage || 'TypeScript',
      defaultFramework: data.defaultFramework || '',
      defaultEnvironment: data.defaultEnvironment || 'development',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'projects', id), payload);

    return {
      id,
      userId,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      defaultLanguage: data.defaultLanguage || 'TypeScript',
      defaultFramework: data.defaultFramework || '',
      defaultEnvironment: data.defaultEnvironment || 'development',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateProject(
  id: string,
  userId: string,
  updates: {
    name?: string;
    description?: string;
    defaultLanguage?: string;
    defaultFramework?: string;
    defaultEnvironment?: string;
  }
): Promise<void> {
  const path = `projects/${id}`;
  try {
    const payload: any = {
      updatedAt: serverTimestamp(),
    };
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (updates.defaultLanguage !== undefined) payload.defaultLanguage = updates.defaultLanguage;
    if (updates.defaultFramework !== undefined) payload.defaultFramework = updates.defaultFramework;
    if (updates.defaultEnvironment !== undefined) payload.defaultEnvironment = updates.defaultEnvironment;

    await updateDoc(doc(db, 'projects', id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteProject(id: string): Promise<void> {
  const path = `projects/${id}`;
  try {
    await deleteDoc(doc(db, 'projects', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ================= INVESTIGATION OPERATIONS =================

export async function listUserInvestigations(userId: string): Promise<InvestigationData[]> {
  const path = 'investigations';
  try {
    const q = query(
      collection(db, 'investigations'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list: InvestigationData[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: data.id || d.id,
        userId: data.userId,
        projectId: data.projectId || '',
        title: data.title || 'Untitled Investigation',
        errorMessage: data.errorMessage || '',
        stackTrace: data.stackTrace || '',
        logSnippet: data.logSnippet || '',
        sourceCode: data.sourceCode || '',
        sourceFilePath: data.sourceFilePath || '',
        language: data.language || 'Auto-detect',
        framework: data.framework || '',
        environment: data.environment || 'development',
        userActions: data.userActions || '',
        analysisResult: data.analysisResult || undefined,
        status: data.status || 'active',
        confidenceScore: data.confidenceScore ?? 0,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
      });
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getInvestigation(id: string): Promise<InvestigationData | null> {
  const path = `investigations/${id}`;
  try {
    const snap = await getDoc(doc(db, 'investigations', id));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: data.id || snap.id,
      userId: data.userId,
      projectId: data.projectId || '',
      title: data.title,
      errorMessage: data.errorMessage || '',
      stackTrace: data.stackTrace || '',
      logSnippet: data.logSnippet || '',
      sourceCode: data.sourceCode || '',
      sourceFilePath: data.sourceFilePath || '',
      language: data.language,
      framework: data.framework || '',
      environment: data.environment || 'development',
      userActions: data.userActions || '',
      analysisResult: data.analysisResult,
      status: data.status || 'active',
      confidenceScore: data.confidenceScore ?? 0,
      createdAt: formatTimestamp(data.createdAt),
      updatedAt: formatTimestamp(data.updatedAt),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function saveInvestigation(
  userId: string,
  params: {
    id?: string;
    projectId?: string;
    title: string;
    errorMessage: string;
    stackTrace?: string;
    logSnippet?: string;
    sourceCode?: string;
    sourceFilePath?: string;
    language: string;
    framework?: string;
    environment: 'development' | 'staging' | 'production' | 'ci_cd' | 'local' | 'other';
    userActions?: string;
    analysisResult: StructuredAnalysisResult;
    status?: 'active' | 'resolved' | 'archived';
  }
): Promise<InvestigationData> {
  const id = params.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `investigations/${id}`;

  try {
    const payload = cleanObject({
      id,
      userId,
      projectId: params.projectId || '',
      title: params.title.trim().slice(0, 200),
      errorMessage: params.errorMessage.slice(0, 20000),
      stackTrace: (params.stackTrace || '').slice(0, 50000),
      logSnippet: (params.logSnippet || '').slice(0, 50000),
      sourceCode: (params.sourceCode || '').slice(0, 50000),
      sourceFilePath: (params.sourceFilePath || '').slice(0, 200),
      language: params.language.slice(0, 60),
      framework: (params.framework || '').slice(0, 60),
      environment: params.environment,
      userActions: (params.userActions || '').slice(0, 2000),
      analysisResult: params.analysisResult,
      status: params.status || 'active',
      confidenceScore: params.analysisResult.confidenceScore || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'investigations', id), payload);

    return {
      id,
      userId,
      projectId: params.projectId || '',
      title: params.title.trim(),
      errorMessage: params.errorMessage,
      stackTrace: params.stackTrace,
      logSnippet: params.logSnippet,
      sourceCode: params.sourceCode,
      sourceFilePath: params.sourceFilePath,
      language: params.language,
      framework: params.framework,
      environment: params.environment,
      userActions: params.userActions,
      analysisResult: params.analysisResult,
      status: params.status || 'active',
      confidenceScore: params.analysisResult.confidenceScore,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateInvestigationStatusOrTitle(
  id: string,
  updates: {
    title?: string;
    status?: 'active' | 'resolved' | 'archived';
    projectId?: string;
  }
): Promise<void> {
  const path = `investigations/${id}`;
  try {
    const payload: any = {
      updatedAt: serverTimestamp(),
    };
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.projectId !== undefined) payload.projectId = updates.projectId;

    await updateDoc(doc(db, 'investigations', id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteInvestigation(id: string): Promise<void> {
  const path = `investigations/${id}`;
  try {
    await deleteDoc(doc(db, 'investigations', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// User Account Data Deletion (GDPR & Privacy compliance)
export async function deleteAllUserData(userId: string): Promise<void> {
  try {
    // 1. Delete all investigations
    const invQuery = query(collection(db, 'investigations'), where('userId', '==', userId));
    const invSnap = await getDocs(invQuery);
    for (const docSnap of invSnap.docs) {
      await deleteDoc(docSnap.ref);
    }

    // 2. Delete all projects
    const prjQuery = query(collection(db, 'projects'), where('userId', '==', userId));
    const prjSnap = await getDocs(prjQuery);
    for (const docSnap of prjSnap.docs) {
      await deleteDoc(docSnap.ref);
    }

    // 3. Delete user document
    await deleteDoc(doc(db, 'users', userId));
  } catch (err) {
    console.error('Error during user data wipe:', err);
    throw err;
  }
}
