import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    if (!token) {
      router.push('/login');
    } else {
      router.push('/home');
    }
  }, []);
  return null;
}