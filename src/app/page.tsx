"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, PresentationControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useSession, signIn, signOut } from "next-auth/react";

function MailIcon() {
  const group = useRef<THREE.Group>(null);
  
  // A simple 3D representation of an envelope using primitive shapes
  return (
    <group ref={group} dispose={null}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3, 2, 0.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Top flap of the envelope */}
      <mesh position={[0, 0.5, 0.11]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[2.1, 2.1, 0.05]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
      </mesh>
      {/* Seal / Accent */}
      <mesh position={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.2} metalness={0.5} />
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <Environment preset="city" />
      
      <PresentationControls
        global
        rotation={[0.13, 0.1, 0]}
        polar={[-0.4, 0.2]}
        azimuth={[-1, 0.75]}
        config={{ mass: 2, tension: 400 }}
        snap={{ mass: 4, tension: 400 }}
      >
        <Float rotationIntensity={0.4} floatIntensity={2} speed={2}>
          <MailIcon />
        </Float>
      </PresentationControls>

      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={4.5}
      />
    </>
  );
}

import { useState } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEmails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setEmails(data.emails);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-50 to-slate-200 overflow-hidden">
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <Scene />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-12 pointer-events-none">
        <main className="max-w-4xl w-full bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl p-10 text-center border border-white/50 pointer-events-auto transition-transform hover:scale-[1.02] max-h-[85vh] overflow-y-auto">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-800">
            JobMail Organizer
          </h1>
          <p className="text-xl text-gray-700 mb-8 font-medium">
            A 3D personal dashboard to organize and track your job application emails.
          </p>
          
          <div className="mb-6">
            {status === 'loading' ? (
              <div className="w-full h-12 flex items-center justify-center">
                <span className="text-gray-500">Loading...</span>
              </div>
            ) : session ? (
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-6 w-full justify-center">
                  <div className="flex items-center gap-3 bg-white/50 px-6 py-3 rounded-full shadow-sm">
                    {session.user?.image && (
                      <img src={session.user.image} alt="User Profile" className="w-10 h-10 rounded-full shadow-sm" />
                    )}
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-800">Welcome, {session.user?.name}</p>
                      <p className="text-xs text-gray-500">{session.user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    Sign Out
                  </button>
                </div>

                <div className="w-full bg-white/80 rounded-2xl p-6 shadow-sm border border-gray-100 text-left">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Your Job Emails</h2>
                    <button 
                      onClick={fetchEmails}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Fetching...' : 'Fetch Latest'}
                    </button>
                  </div>
                  
                  {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                  
                  {emails.length > 0 ? (
                    <div className="space-y-4">
                      {emails.map(email => (
                        <div key={email.id} className="p-4 border border-gray-200 rounded-xl bg-white hover:border-blue-300 transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-semibold text-gray-900 truncate flex-1">{email.subject}</p>
                            {email.category && (
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${email.category.color}`}>
                                {email.category.label}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1 mb-2">
                            <span className="truncate max-w-[70%]">{email.from}</span>
                            <span>{new Date(email.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{email.snippet}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Click fetch to scan your inbox for job applications.</p>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="px-8 py-3.5 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-3 mx-auto"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
