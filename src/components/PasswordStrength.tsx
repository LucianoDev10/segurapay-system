'use client'

interface Rule {
  label: string
  test: (p: string) => boolean
}

const RULES: Rule[] = [
  { label: 'mínimo 8 caracteres',     test: p => p.length >= 8 },
  { label: 'letra maiúscula (A-Z)',    test: p => /[A-Z]/.test(p) },
  { label: 'letra minúscula (a-z)',    test: p => /[a-z]/.test(p) },
  { label: 'número (0-9)',             test: p => /[0-9]/.test(p) },
]

export function passwordIsStrong(password: string) {
  return RULES.every(r => r.test(password))
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const passed = RULES.filter(r => r.test(password)).length
  const strength = passed <= 1 ? 'fraca' : passed <= 2 ? 'média' : passed <= 3 ? 'boa' : 'forte'
  const colors = ['#EF4444', '#D97706', '#1B4DFF', '#10B981']
  const widths = ['w-1/4', 'w-2/4', 'w-3/4', 'w-full']
  const idx = passed - 1

  return (
    <div className="flex flex-col gap-2 mt-1">
      {/* Barra */}
      <div className="h-1 bg-[#E4E8F0] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${widths[idx] ?? 'w-0'}`}
          style={{ backgroundColor: colors[idx] ?? 'transparent' }}
        />
      </div>

      {/* Regras */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {RULES.map(rule => {
          const ok = rule.test(password)
          return (
            <div key={rule.label} className="flex items-center gap-1.5">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-[#ECFDF5]' : 'bg-[#E4E8F0]'}`}>
                {ok
                  ? <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <div className="w-1 h-1 rounded-full bg-[#8890A4]" />
                }
              </div>
              <span className={`text-[11px] ${ok ? 'text-[#047857]' : 'text-[#8890A4]'}`}>
                {rule.label}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-[#8890A4]">
        Força: <span style={{ color: colors[idx] }} className="font-medium">{strength}</span>
      </p>
    </div>
  )
}
