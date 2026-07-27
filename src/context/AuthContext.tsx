'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../supabaseClient'
import { mockDb } from '../mockData'
import { Profile, UserRole, Company } from '../types'

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  enableDemoMode: (enabled: boolean) => void;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isDemoMode: false,
  signIn: async () => {},
  signOut: async () => {},
  switchDemoRole: () => {},
  enableDemoMode: () => {},
  refreshProfile: () => {}
})

export const useAuth = () => useContext(AuthContext)

const MOCK_COMPANIES = [
  { id: 'c1', name: 'Acme Corp', industry: 'SaaS', website: 'acme.com', is_client: true, monthly_retainer_amount: 5000, contract_start_date: '2026-01-15', contract_status: 'active' },
  { id: 'c2', name: 'Globex Inc', industry: 'Logistics', website: 'globex.com', is_client: true, monthly_retainer_amount: 7500, contract_start_date: '2026-03-01', contract_status: 'active' },
  { id: 'c3', name: 'Initech', industry: 'Software', website: 'initech.com', is_client: false, monthly_retainer_amount: null, contract_start_date: null, contract_status: 'active' },
  { id: 'c4', name: 'Umbrella Corp', industry: 'BioTech', website: 'umbrella.org', is_client: true, monthly_retainer_amount: 12000, contract_start_date: '2025-10-10', contract_status: 'active' },
  { id: 'c5', name: 'Hooli', industry: 'Tech Conglomerate', website: 'hooli.xyz', is_client: false, monthly_retainer_amount: null, contract_start_date: null, contract_status: 'active' }
]

const MOCK_PROFILES: Record<UserRole, Profile> = {
  admin: { id: 'u-admin', name: 'Alex Thompson', email: 'admin@wahs.co', role: 'admin', company_id: null, created_at: '2026-01-01' },
  acquisition: { id: 'u-acq', name: 'Sarah Jenkins', email: 'acq@wahs.co', role: 'acquisition', company_id: null, created_at: '2026-01-01' },
  sales: { id: 'u-sales', name: 'Michael Scott', email: 'sales@wahs.co', role: 'sales', company_id: null, created_at: '2026-01-01' },
  accounting: { id: 'u-acc', name: 'Oscar Martinez', email: 'accounting@wahs.co', role: 'accounting', company_id: null, created_at: '2026-01-01' },
  client: { id: 'u-client', name: 'Richard Hendricks', email: 'richard@hooli.xyz', role: 'client', company_id: 'c1', created_at: '2026-01-01' }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wahs_crm_demo_mode') === 'true'
    }
    return true
  })

  // Synchronize Demo Mode flag
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wahs_crm_demo_mode', isDemoMode.toString())
    }
  }, [isDemoMode])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', userId)
        .single()

      if (error) {
        console.error("Error fetching public profile:", error)
        setProfile(null)
      } else {
        setProfile(data as Profile)
      }
    } catch (err) {
      console.error("Profile query failed, setting fallback", err)
      setProfile(null)
    }
  }

  // Monitor auth status
  useEffect(() => {
    if (isDemoMode) {
      // Restore demo user from localStorage if exists
      const savedRole = (typeof window !== 'undefined' ? localStorage.getItem('wahs_crm_demo_role') : null) as UserRole || 'admin'
      const demoProfile = MOCK_PROFILES[savedRole]
      setUser({ id: demoProfile.id, email: demoProfile.email })
      setProfile({
        ...demoProfile,
        companies: demoProfile.company_id ? (MOCK_COMPANIES.find(c => c.id === demoProfile.company_id) as unknown as Company) : null
      })
      setLoading(false)
      return
    }

    // Verify if environment is configured
    const isConfigured = (process.env.NEXT_PUBLIC_VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || (process.env as any).VITE_SUPABASE_URL) && 
                         (process.env.NEXT_PUBLIC_VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (process.env as any).VITE_SUPABASE_ANON_KEY)

    if (!isConfigured) {
      console.log("No Supabase configuration detected. Bootstrapping application in Demo Mode.")
      setIsDemoMode(true)
      const demoProfile = MOCK_PROFILES.admin
      setUser({ id: demoProfile.id, email: demoProfile.email })
      setProfile(demoProfile)
      setLoading(false)
      return
    }

    // Standard Supabase Setup
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user || null
      setUser(sessionUser)
      if (sessionUser) {
        fetchProfile(sessionUser.id).then(() => setLoading(false))
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sessionUser = session?.user || null
      setUser(sessionUser)
      if (sessionUser) {
        setLoading(true)
        await fetchProfile(sessionUser.id)
        setLoading(false)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [isDemoMode])

  const signIn = async (email: string, password: string): Promise<any> => {
    setLoading(true)
    if (isDemoMode) {
      // Verify in demo roles
      const matchedRole = Object.keys(MOCK_PROFILES).find(
        key => MOCK_PROFILES[key as UserRole].email.toLowerCase() === email.toLowerCase()
      ) as UserRole | undefined
      
      if (matchedRole) {
        const demoProfile = MOCK_PROFILES[matchedRole]
        if (typeof window !== 'undefined') {
          localStorage.setItem('wahs_crm_demo_role', matchedRole)
        }
        setUser({ id: demoProfile.id, email: demoProfile.email })
        setProfile({
          ...demoProfile,
          companies: demoProfile.company_id ? (MOCK_COMPANIES.find(c => c.id === demoProfile.company_id) as unknown as Company) : null
        })
        setLoading(false)
        return { user: { id: demoProfile.id, email: demoProfile.email } }
      } else {
        setLoading(false)
        throw new Error("Invalid email or password for Demo Mode. Use: admin@wahs.co, sales@wahs.co, acq@wahs.co, accounting@wahs.co, or richard@hooli.xyz (any password).")
      }
    }

    // Standard Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      throw error
    }
    return data
  }

  const signOut = async (): Promise<void> => {
    setLoading(true)
    if (isDemoMode) {
      setUser(null)
      setProfile(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wahs_crm_demo_role')
      }
      setLoading(false)
      return
    }

    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error(e)
    }
    setUser(null)
    setProfile(null)
    setLoading(false)
  }

  const enableDemoMode = (enabled: boolean): void => {
    setIsDemoMode(enabled)
  }

  const switchDemoRole = (role: UserRole): void => {
    if (!isDemoMode) return
    setLoading(true)
    const demoProfile = MOCK_PROFILES[role]
    if (demoProfile) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('wahs_crm_demo_role', role)
      }
      setUser({ id: demoProfile.id, email: demoProfile.email })
      setProfile({
        ...demoProfile,
        companies: demoProfile.company_id ? (MOCK_COMPANIES.find(c => c.id === demoProfile.company_id) as unknown as Company) : null
      })
    }
    setLoading(false)
  }

  const value = {
    user,
    profile,
    loading,
    isDemoMode,
    signIn,
    signOut,
    switchDemoRole,
    enableDemoMode,
    refreshProfile: () => {
      if (!isDemoMode && user) {
        fetchProfile(user.id)
      }
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
