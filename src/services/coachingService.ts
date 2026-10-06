import { 
  CoachingClass, 
  CoachingBatch, 
  StudyMaterial, 
  HomeworkAssignment, 
  TestRecord, 
  ResultRecord 
} from '../types/models';
import { 
  repoClasses, 
  repoBatches, 
  repoStudyMaterials, 
  repoHomework, 
  repoTests, 
  repoResults 
} from './dataRepository';

export function subscribeToClasses(callback: (classes: CoachingClass[]) => void) {
  return repoClasses.subscribe(callback);
}

export async function createClass(data: { name: string; section?: string; stream?: string; academicYear?: string }): Promise<CoachingClass> {
  const classId = `cls_${Date.now()}`;
  const record: CoachingClass = {
    classId,
    name: data.name,
    section: data.section || 'A',
    stream: data.stream || 'General / Competitive',
    academicYear: data.academicYear || '2026-2027',
    createdAt: new Date().toISOString()
  };
  await repoClasses.set(record);
  return record;
}

export function subscribeToBatches(callback: (batches: CoachingBatch[]) => void) {
  return repoBatches.subscribe(callback);
}

export async function createBatch(data: { name: string; classId: string; className?: string; timing?: string; instructor?: string }): Promise<CoachingBatch> {
  const batchId = `btch_${Date.now()}`;
  const record: CoachingBatch = {
    batchId,
    name: data.name,
    classId: data.classId,
    className: data.className || 'General',
    timing: data.timing || '08:00 AM - 10:00 AM',
    instructor: data.instructor || 'Staff Faculty',
    createdAt: new Date().toISOString()
  };
  await repoBatches.set(record);
  return record;
}

export function subscribeToStudyMaterials(callback: (materials: StudyMaterial[]) => void) {
  return repoStudyMaterials.subscribe(callback);
}

export async function createStudyMaterial(
  data: Omit<StudyMaterial, 'materialId' | 'createdAt' | 'updatedAt'>,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<StudyMaterial> {
  const materialId = `mat_${Date.now()}`;
  const nowIso = new Date().toISOString();
  const record: StudyMaterial = {
    ...data,
    materialId,
    uploadedBy: currentAdmin.name,
    createdAt: nowIso,
    updatedAt: nowIso
  };
  await repoStudyMaterials.set(record);
  return record;
}

export function subscribeToHomework(callback: (items: HomeworkAssignment[]) => void) {
  return repoHomework.subscribe(callback);
}

export async function createHomework(
  data: Omit<HomeworkAssignment, 'id' | 'createdAt'>,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<HomeworkAssignment> {
  const id = `hw_${Date.now()}`;
  const record: HomeworkAssignment = {
    ...data,
    id,
    createdBy: currentAdmin.name,
    createdAt: new Date().toISOString()
  };
  await repoHomework.set(record);
  return record;
}

export function subscribeToTests(callback: (tests: TestRecord[]) => void) {
  return repoTests.subscribe(callback);
}

export async function createTest(data: Omit<TestRecord, 'testId' | 'createdAt'>): Promise<TestRecord> {
  const testId = `tst_${Date.now()}`;
  const record: TestRecord = {
    ...data,
    testId,
    createdAt: new Date().toISOString()
  };
  await repoTests.set(record);
  return record;
}

export function subscribeToResults(callback: (results: ResultRecord[]) => void) {
  return repoResults.subscribe(callback);
}

export async function publishResult(data: Omit<ResultRecord, 'resultId' | 'createdAt'>): Promise<ResultRecord> {
  const resultId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record: ResultRecord = {
    ...data,
    resultId,
    createdAt: new Date().toISOString()
  };
  await repoResults.set(record);
  return record;
}
