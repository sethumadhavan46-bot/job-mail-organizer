import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <main className="max-w-3xl w-full bg-white shadow-xl rounded-2xl p-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          JobMail Organizer
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          A personal dashboard to organize and track your job application emails.
        </p>
        
        <div className="border-t border-gray-200 pt-8 mt-8">
          <p className="text-sm text-gray-500">
            More features coming soon: Gmail integration, AI categorization, and more.
          </p>
        </div>
      </main>
    </div>
  );
}
