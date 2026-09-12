import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './collections';
import type { Produk, ProdukInput } from '../types/produk';

const produkCollection = collection(db, COLLECTIONS.produk);

export function subscribeProduk(
  onChange: (produk: Produk[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    produkCollection,
    (snapshot) => {
      const daftar = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Produk);
      onChange(daftar);
    },
    onError,
  );
}

export async function tambahProduk(input: ProdukInput): Promise<void> {
  await addDoc(produkCollection, {
    ...input,
    dibuatPada: serverTimestamp(),
    diperbaruiPada: serverTimestamp(),
  });
}

export async function updateProduk(id: string, input: ProdukInput): Promise<void> {
  await updateDoc(doc(produkCollection, id), {
    ...input,
    diperbaruiPada: serverTimestamp(),
  });
}

export async function hapusProduk(id: string): Promise<void> {
  await deleteDoc(doc(produkCollection, id));
}
