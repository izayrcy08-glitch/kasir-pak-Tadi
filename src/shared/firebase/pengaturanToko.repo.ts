import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './collections';
import type { PengaturanToko, PengaturanTokoInput } from '../types/pengaturanToko';

const ID_DOKUMEN = 'default';
const pengaturanTokoDoc = doc(db, COLLECTIONS.pengaturanToko, ID_DOKUMEN);

export function subscribePengaturanToko(
  onChange: (pengaturan: PengaturanToko | null) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    pengaturanTokoDoc,
    (snapshot) => {
      onChange(snapshot.exists() ? (snapshot.data() as PengaturanToko) : null);
    },
    onError,
  );
}

export async function simpanPengaturanToko(input: PengaturanTokoInput): Promise<void> {
  await setDoc(
    pengaturanTokoDoc,
    {
      ...input,
      diperbaruiPada: serverTimestamp(),
    },
    { merge: true },
  );
}
