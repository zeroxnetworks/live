import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    try {
      return initializeApp({ credential: cert(JSON.parse(rawJson)) });
    } catch (error) {
      console.error("[Firebase Admin] Invalid FIREBASE_SERVICE_ACCOUNT_JSON:", error);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  return initializeApp();
}

const adminApp = getAdminApp();
const firestore = getFirestore(adminApp);
const firebaseAuth = getAuth(adminApp);

class DocRefWrapper {
  id: string;
  constructor(public ref: FirebaseFirestore.DocumentReference) { this.id = ref.id; }
  collection(subName: string) { return new CollectionWrapper(this.ref.collection(subName)); }
  async get() {
    const snap = await this.ref.get();
    return { exists: snap.exists, id: snap.id, ref: this, data: (): any => snap.data() };
  }
  async update(data: any) { return this.ref.update(data); }
  async set(data: any, options?: FirebaseFirestore.SetOptions) { return options ? this.ref.set(data, options) : this.ref.set(data); }
  async delete() { return this.ref.delete(); }
}

class QueryWrapper {
  constructor(public q: FirebaseFirestore.Query) {}
  where(field: string, op: FirebaseFirestore.WhereFilterOp, val: any) { return new QueryWrapper(this.q.where(field, op, val)); }
  orderBy(field: string, directionStr?: FirebaseFirestore.OrderByDirection) { return new QueryWrapper(this.q.orderBy(field, directionStr)); }
  limit(limitNum: number) { return new QueryWrapper(this.q.limit(limitNum)); }
  async get() {
    const snap = await this.q.get();
    return {
      empty: snap.empty,
      docs: snap.docs.map(d => ({ id: d.id, ref: new DocRefWrapper(d.ref), data: (): any => d.data() })),
      forEach: (cb: any) => snap.forEach(d => cb({ id: d.id, ref: new DocRefWrapper(d.ref), data: (): any => d.data() }))
    };
  }
}

class CollectionWrapper extends QueryWrapper {
  constructor(private readonly collectionRef: FirebaseFirestore.CollectionReference) { super(collectionRef); }
  doc(id?: string) { return new DocRefWrapper(id ? this.collectionRef.doc(id) : this.collectionRef.doc()); }
  where(field: string, op: FirebaseFirestore.WhereFilterOp, val: any) { return new QueryWrapper(this.collectionRef.where(field, op, val)); }
  orderBy(field: string, directionStr?: FirebaseFirestore.OrderByDirection) { return new QueryWrapper(this.collectionRef.orderBy(field, directionStr)); }
  limit(limitNum: number) { return new QueryWrapper(this.collectionRef.limit(limitNum)); }
  async add(data: any) { return new DocRefWrapper(await this.collectionRef.add(data)); }
  async get() { return new QueryWrapper(this.collectionRef).get(); }
}

export const adminDb = {
  collection: (name: string) => new CollectionWrapper(firestore.collection(name)),
  runTransaction: async (updateFunction: (transaction: any) => Promise<any>) => firestore.runTransaction(async transaction => {
    const wrapperT = {
      get: async (docRefWrapper: DocRefWrapper) => {
        const snap = await transaction.get(docRefWrapper.ref);
        return { exists: snap.exists, id: snap.id, data: (): any => snap.data() };
      },
      update: (docRefWrapper: DocRefWrapper, data: any) => transaction.update(docRefWrapper.ref, data),
      set: (docRefWrapper: DocRefWrapper, data: any, options?: FirebaseFirestore.SetOptions) => options ? transaction.set(docRefWrapper.ref, data, options) : transaction.set(docRefWrapper.ref, data),
      delete: (docRefWrapper: DocRefWrapper) => transaction.delete(docRefWrapper.ref)
    };
    return updateFunction(wrapperT);
  })
};

export const adminAuth = firebaseAuth;

export const admin = {
  firestore: {
    FieldValue: {
      serverTimestamp: () => FieldValue.serverTimestamp(),
      increment: (n: number) => FieldValue.increment(n)
    }
  }
};

export { adminApp };
