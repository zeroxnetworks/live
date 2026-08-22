import { db, auth } from "../src/lib/firebase";
import { collection, doc, getDoc, getDocs, updateDoc, setDoc, addDoc, deleteDoc, query, where, serverTimestamp, orderBy, limit, increment, runTransaction } from "firebase/firestore";

class DocRefWrapper {
  id: string;
  constructor(public ref: any) {
    this.id = ref.id;
  }
  collection(subName: string) {
    return new CollectionWrapper(`${this.ref.path}/${subName}`);
  }
  async get() {
    const snap = await getDoc(this.ref);
    return {
      exists: snap.exists(),
      id: snap.id,
      ref: this,
      data: (): any => snap.data()
    };
  }
  async update(data: any) { return updateDoc(this.ref, data); }
  async set(data: any, options?: any) { return options ? setDoc(this.ref, data, options) : setDoc(this.ref, data); }
  async delete() { return deleteDoc(this.ref); }
}

class QueryWrapper {
  constructor(public q: any) {}
  where(field: string, op: any, val: any) {
    return new QueryWrapper(query(this.q, where(field, op, val)));
  }
  orderBy(field: string, directionStr?: any) {
    return new QueryWrapper(query(this.q, orderBy(field, directionStr)));
  }
  limit(limitNum: number) {
    return new QueryWrapper(query(this.q, limit(limitNum)));
  }
  async get() {
    const snap = await getDocs(this.q);
    return {
      empty: snap.empty,
      docs: snap.docs.map(d => ({
        id: d.id,
        ref: new DocRefWrapper(d.ref),
        data: (): any => d.data()
      })),
      forEach: (cb: any) => {
        snap.forEach(d => cb({
           id: d.id,
           ref: new DocRefWrapper(d.ref),
           data: (): any => d.data()
        }));
      }
    };
  }
}

class CollectionWrapper {
  constructor(public name: string) {}
  doc(id?: string) {
    if (id) return new DocRefWrapper(doc(db, this.name, id));
    return new DocRefWrapper(doc(collection(db, this.name)));
  }
  where(field: string, op: any, val: any) {
    return new QueryWrapper(query(collection(db, this.name), where(field, op, val)));
  }
  orderBy(field: string, directionStr?: any) {
    return new QueryWrapper(query(collection(db, this.name), orderBy(field, directionStr)));
  }
  limit(limitNum: number) {
    return new QueryWrapper(query(collection(db, this.name), limit(limitNum)));
  }
  async add(data: any) {
    const ref = await addDoc(collection(db, this.name), data);
    return new DocRefWrapper(ref);
  }
  async get() {
    return new QueryWrapper(collection(db, this.name)).get();
  }
}

export const adminDb = {
  collection: (name: string) => new CollectionWrapper(name),
  runTransaction: async (updateFunction: (transaction: any) => Promise<any>) => {
    return runTransaction(db, async (t) => {
      const wrapperT = {
        get: async (docRefWrapper: DocRefWrapper) => {
          const snap = await t.get(docRefWrapper.ref);
          return {
            exists: snap.exists(),
            id: snap.id,
            data: (): any => snap.data()
          };
        },
        update: (docRefWrapper: DocRefWrapper, data: any) => {
          t.update(docRefWrapper.ref, data);
        },
        set: (docRefWrapper: DocRefWrapper, data: any, options?: any) => {
          if (options) {
            t.set(docRefWrapper.ref, data, options);
          } else {
            t.set(docRefWrapper.ref, data);
          }
        },
        delete: (docRefWrapper: DocRefWrapper) => {
          t.delete(docRefWrapper.ref);
        }
      };
      return updateFunction(wrapperT);
    });
  }
};

export const adminAuth = {
  ...auth,
  async createUser(params: { email: string; password?: string; displayName?: string; emailVerified?: boolean }) {
    if ((auth as any).createUser) {
      return (auth as any).createUser(params);
    }
    return {
      uid: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      email: params.email,
      displayName: params.displayName || "",
      emailVerified: !!params.emailVerified
    };
  },
  async updateUser(uid: string, params: any) {
    if ((auth as any).updateUser) {
      return (auth as any).updateUser(uid, params);
    }
    return true;
  },
  async getUserByEmail(email: string) {
    if ((auth as any).getUserByEmail) {
      return (auth as any).getUserByEmail(email);
    }
    return null;
  }
};

export const admin = {
  firestore: {
    FieldValue: {
      serverTimestamp: () => serverTimestamp(),
      increment: (n: number) => increment(n)
    }
  }
};
