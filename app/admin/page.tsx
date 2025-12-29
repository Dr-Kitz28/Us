// Admin Dashboard
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🔧 Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            System administration and testing tools
          </p>
        </div>

        {/* Admin Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Golden Ratio Testing */}
          <Link href="/admin/golden-ratio-testing">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 hover:border-purple-300">
              <div className="text-center">
                <div className="text-4xl mb-4">🔬</div>
                <h3 className="text-xl font-bold mb-2">Golden Ratio Testing</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Train and test neural network for facial proportion analysis using φ ≈ 1.618
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Open Testing Lab
                </Button>
              </div>
            </div>
          </Link>

          {/* User Management */}
          <Link href="/admin/user-management">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:border-blue-300 cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-xl font-bold mb-2">User Management</h3>
                <p className="text-gray-600 text-sm mb-4">
                  View and manage user accounts, profiles, and activities
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Manage Users
                </Button>
              </div>
            </div>
          </Link>

          {/* Analytics */}
          <Link href="/admin/analytics">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:border-green-300 cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600 text-sm mb-4">
                  View app usage statistics, match rates, and user behavior
                </p>
                <Button className="bg-green-600 hover:bg-green-700">
                  View Analytics
                </Button>
              </div>
            </div>
          </Link>

          {/* Feature Flags */}
          <Link href="/admin/feature-flags">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:border-yellow-300 cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">🚩</div>
                <h3 className="text-xl font-bold mb-2">Feature Flags</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Enable/disable features and experiments for different user groups
                </p>
                <Button className="bg-yellow-600 hover:bg-yellow-700">
                  Manage Flags
                </Button>
              </div>
            </div>
          </Link>

          {/* Database Tools */}
          <Link href="/admin/database-tools">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:border-indigo-300 cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">💾</div>
                <h3 className="text-xl font-bold mb-2">Database Tools</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Database management, backups, and data migration tools
                </p>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Database Tools
                </Button>
              </div>
            </div>
          </Link>

          {/* System Health */}
          <Link href="/admin/system-health">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:border-red-300 cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">💓</div>
                <h3 className="text-xl font-bold mb-2">System Health</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Monitor system performance, API health, and error logs
                </p>
                <Button className="bg-red-600 hover:bg-red-700">
                  View Health
                </Button>
              </div>
            </div>
          </Link>
        </div>

        {/* Research Information */}
        <div className="mt-12 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
          <h3 className="text-xl font-bold mb-4">🧠 Research-Backed Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-bold mb-2">Golden Ratio Analysis</h4>
              <p className="mb-2">Our AI-powered photo evaluation system uses:</p>
              <ul className="list-disc pl-5">
                <li>TensorFlow.js neural networks</li>
                <li>Leonardo da Vinci's facial proportions</li>
                <li>Modern computer vision techniques</li>
                <li>Continuous learning from user data</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">Psychological Insights</h4>
              <p className="mb-2">Research-backed matching includes:</p>
              <ul className="list-disc pl-5">
                <li>Variable reward schedule engagement</li>
                <li>Choice overload protection algorithms</li>
                <li>Conversation quality optimization</li>
                <li>Behavioral pattern analysis</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-blue-600">6</div>
            <div className="text-sm text-gray-600">Active Tools</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-green-600">φ</div>
            <div className="text-sm text-gray-600">Golden Ratio</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-purple-600">AI</div>
            <div className="text-sm text-gray-600">Neural Network</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-orange-600">∞</div>
            <div className="text-sm text-gray-600">Possibilities</div>
          </div>
        </div>
      </div>
    </div>
  )
}
