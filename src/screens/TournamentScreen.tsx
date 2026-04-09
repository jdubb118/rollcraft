import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadPlayer, saveOpponent, loadProgression, spendMoney, addMoney, loadBattleResult, updateProgression } from '../state/saveLoad';
import { getTournament, generateBracket } from '../data/tournaments';
import { STYLE_NAMES, STYLE_COLORS } from '../engine/constants';
import type { Grappler, TournamentResult } from '../engine/types';
import { getLevel } from '../battle/stats';
import { RIVAL_ENCOUNTERS, RIVAL_NAME } from '../data/storyArc';

type TourneyPhase = 'registration' | 'bracket' | 'pre-match' | 'fighting' | 'result' | 'podium';

interface BracketMatch {
  round: number;
  matchIndex: number;
  fighter1: Grappler | null;
  fighter2: Grappler | null;
  winner: Grappler | null;
}

const TOURNEY_STORAGE_KEY = 'rollcraft-active-tournament';

export default function TournamentScreen() {
  const navigate = useNavigate();
  const player = loadPlayer();
  const [phase, setPhase] = useState<TourneyPhase>('registration');
  const [bracket, setBracket] = useState<Grappler[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [, setCurrentMatch] = useState(0);
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [eliminated, setEliminated] = useState(false);
  const [placement, setPlacement] = useState<'gold' | 'silver' | 'bronze' | 'out'>('out');

  // Get tournament ID from URL
  const [searchParams] = useSearchParams();
  const tourneyId = searchParams.get('id') || '';
  const tournament = getTournament(tourneyId);

  // Restore tournament state from localStorage (returning from battle)
  useEffect(() => {
    const saved = localStorage.getItem(TOURNEY_STORAGE_KEY);
    if (saved && tournament) {
      try {
        const data = JSON.parse(saved);
        if (data.tournamentId === tournament.id) {
          setBracket(data.bracket);
          setMatches(data.matches);
          setCurrentRound(data.currentRound);
          setPhase('result'); // trigger the result processing useEffect
        }
      } catch {}
      localStorage.removeItem(TOURNEY_STORAGE_KEY);
    }
  }, []);

  if (!player || !tournament) {
    return (
      <div className="game-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <div style={{ fontSize: 'var(--fs-md)', color: '#ef4444' }}>Tournament not found</div>
        <button onClick={() => navigate('/overworld')} style={{
          marginTop: 20, padding: '10px 20px', background: '#1a1a2e',
          color: '#888', fontSize: 'var(--fs-xs)', border: '1px solid #444',
        }}>BACK</button>
      </div>
    );
  }

  const prog = loadProgression();

  // Generate bracket on registration
  function handleRegister() {
    if (prog.money < tournament!.entryFee) return;
    spendMoney(tournament!.entryFee);

    const opponents = generateBracket(tournament!, player!.name);
    // Insert player at position 0, shuffle the rest
    const allFighters = [player!, ...opponents];

    // Create bracket matches
    const roundMatches: BracketMatch[] = [];

    // First round — pair up fighters
    for (let i = 0; i < allFighters.length; i += 2) {
      roundMatches.push({
        round: 0,
        matchIndex: i / 2,
        fighter1: allFighters[i],
        fighter2: allFighters[i + 1] || null,
        winner: null,
      });
    }

    setBracket(allFighters);
    setMatches(roundMatches);
    setCurrentRound(0);
    setCurrentMatch(0);
    setPhase('bracket');
  }

  // Find the player's next match
  function getPlayerMatch(): BracketMatch | null {
    return matches.find(m =>
      m.round === currentRound &&
      !m.winner &&
      (m.fighter1?.name === player!.name || m.fighter2?.name === player!.name)
    ) || null;
  }

  // Simulate AI vs AI match
  function simulateMatch(m: BracketMatch): Grappler {
    // Simple: higher level + random wins
    const f1 = m.fighter1!;
    const f2 = m.fighter2!;
    const score1 = getLevel(f1) + Math.random() * 10;
    const score2 = getLevel(f2) + Math.random() * 10;
    return score1 >= score2 ? f1 : f2;
  }

  // Advance bracket after player returns from battle
  // Use timeout to ensure state from restore has settled
  useEffect(() => {
    if (phase !== 'result') return;
    const timer = setTimeout(() => {
      const result = loadBattleResult();
      if (!result || matches.length === 0) return;

      const playerMatch = matches.find(m =>
        m.round === currentRound &&
        (m.fighter1?.name === player!.name || m.fighter2?.name === player!.name) &&
        !m.winner
      );

      if (!playerMatch) return;

      if (result.winner === 'player') {
        playerMatch.winner = player!;
        setMatches([...matches]);
        advanceRound();
      } else {
        playerMatch.winner = playerMatch.fighter1?.name === player!.name ? playerMatch.fighter2! : playerMatch.fighter1!;
        setMatches([...matches]);
        setEliminated(true);
        const totalRounds = Math.log2(tournament!.bracketSize);
        if (currentRound === totalRounds - 1) setPlacement('silver');
        else if (currentRound === totalRounds - 2) setPlacement('bronze');
        else setPlacement('out');
        setPhase('podium');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [phase, matches.length]);

  function advanceRound() {
    const totalRounds = Math.log2(tournament!.bracketSize);
    const roundMatches = matches.filter(m => m.round === currentRound);

    // Simulate remaining non-player matches
    for (const m of roundMatches) {
      if (!m.winner && m.fighter1 && m.fighter2) {
        m.winner = simulateMatch(m);
      }
    }

    // Check if tournament is over (player won the final)
    if (currentRound >= totalRounds - 1) {
      setPlacement('gold');
      setPhase('podium');
      return;
    }

    // Build next round
    const winners = roundMatches.map(m => m.winner!).filter(Boolean);
    const nextRound = currentRound + 1;
    const nextMatches: BracketMatch[] = [];
    for (let i = 0; i < winners.length; i += 2) {
      nextMatches.push({
        round: nextRound,
        matchIndex: i / 2,
        fighter1: winners[i],
        fighter2: winners[i + 1] || null,
        winner: null,
      });
    }

    setMatches(prev => [...prev, ...nextMatches]);
    setCurrentRound(nextRound);
    setPhase('bracket');
  }

  // Start player's match
  function startPlayerMatch() {
    const pm = getPlayerMatch();
    if (!pm) return;
    const opponent = pm.fighter1?.name === player!.name ? pm.fighter2! : pm.fighter1!;
    saveOpponent(opponent);
    // Save tournament state so we can return after battle
    localStorage.setItem(TOURNEY_STORAGE_KEY, JSON.stringify({
      tournamentId: tournament!.id,
      matches,
      currentRound,
      bracket,
    }));
    // Mark as tournament battle for result screen routing
    localStorage.setItem('rollcraft-active-tourney-id', tournament!.id);
    setPhase('fighting');
    navigate('/battle');
  }

  // Handle podium — award prizes
  function handleFinish() {
    const prize = placement === 'gold' ? tournament!.prizePool.gold
      : placement === 'silver' ? tournament!.prizePool.silver
      : placement === 'bronze' ? tournament!.prizePool.bronze : 0;

    if (prize > 0) addMoney(prize);

    // Record tournament result
    const result: TournamentResult = {
      tournamentId: tournament!.id,
      placement,
      prizeMoney: prize,
      timestamp: Date.now(),
    };
    const updatedResults = [...prog.tournamentResults, result];
    updateProgression({ tournamentResults: updatedResults });

    navigate('/overworld');
  }

  // ── RENDER ──

  const totalRounds = Math.log2(tournament.bracketSize);
  const roundNames = totalRounds === 2 ? ['SEMIS', 'FINAL']
    : totalRounds === 3 ? ['QUARTERS', 'SEMIS', 'FINAL']
    : ['R1', 'R2', 'SEMIS', 'FINAL'];

  return (
    <div className="game-shell" style={{ gap: 0, overflow: 'auto' }} >

      {/* Header */}
      <div style={{
        padding: '10px 14px', background: '#0d0d1a', borderBottom: '2px solid #222',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 'var(--fs-lg)', color: '#ffd700' }}>{tournament.name.toUpperCase()}</div>
        <div style={{ fontSize: 'var(--fs-xs)', color: '#888', marginTop: 4 }}>
          {tournament.bracketSize}-man bracket | {tournament.ruleSet.toUpperCase()} | {tournament.beltMin.toUpperCase()}-{tournament.beltMax.toUpperCase()}
        </div>
      </div>

      {/* Registration */}
      {phase === 'registration' && (() => {
        const rivalEvent = RIVAL_ENCOUNTERS.find(e => e.region === tournament.regionId && e.trigger?.includes('tournament'));
        const storyKey = `rollcraft-rival-tourney-${tournament.id}`;
        const showRival = rivalEvent && !localStorage.getItem(storyKey);
        if (showRival) localStorage.setItem(storyKey, 'true');
        return (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {showRival && rivalEvent && (
            <div style={{ marginBottom: 8, textAlign: 'center' }}>
              {rivalEvent.dialogueBefore.map((dl, i) => (
                <div key={i} style={{
                  fontSize: 'var(--fs-xs)', lineHeight: 1.8,
                  color: dl.speaker === RIVAL_NAME ? '#ef4444' : '#ccc',
                }}>
                  {dl.speaker}: {dl.line}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 'var(--fs-sm)', color: '#aaa', textAlign: 'center', lineHeight: 2 }}>
            Entry fee: ${tournament.entryFee}<br/>
            Gold: ${tournament.prizePool.gold} | Silver: ${tournament.prizePool.silver} | Bronze: ${tournament.prizePool.bronze}<br/>
            You have: ${prog.money}
          </div>
          <button
            onClick={handleRegister}
            disabled={prog.money < tournament.entryFee}
            style={{
              padding: '12px 30px', background: '#1a2a1a',
              color: prog.money >= tournament.entryFee ? '#22c55e' : '#555',
              fontSize: 'var(--fs-md)',
              border: `2px solid ${prog.money >= tournament.entryFee ? '#22c55e' : '#333'}`,
            }}
          >
            REGISTER (${tournament.entryFee})
          </button>
          <button
            onClick={() => navigate('/overworld')}
            style={{
              padding: '8px 20px', background: '#1a1a2e', color: '#888',
              fontSize: 'var(--fs-xs)', border: '1px solid #444',
            }}
          >
            BACK
          </button>
        </div>
        );
      })()}

      {/* Bracket view */}
      {(phase === 'bracket' || phase === 'pre-match') && (
        <div style={{ padding: 12, flex: 1 }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: '#888', textAlign: 'center', marginBottom: 10 }}>
            ROUND: {roundNames[currentRound] || `R${currentRound + 1}`}
          </div>

          {/* Current round matches */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {matches.filter(m => m.round === currentRound).map((m, i) => {
              const isPlayerMatch = m.fighter1?.name === player!.name || m.fighter2?.name === player!.name;
              const border = isPlayerMatch ? '#ffd700' : '#333';
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', background: '#111', border: `2px solid ${border}`,
                }}>
                  {/* Fighter 1 */}
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{
                      fontSize: 'var(--fs-xs)',
                      color: m.winner === m.fighter1 ? '#22c55e' : m.winner ? '#555' : '#ddd',
                      fontWeight: m.fighter1?.name === player!.name ? 'bold' : 'normal',
                    }}>
                      {m.fighter1?.name || 'BYE'}
                    </div>
                    {m.fighter1 && (
                      <div style={{ fontSize: 7, color: STYLE_COLORS[m.fighter1.style] }}>
                        {STYLE_NAMES[m.fighter1.style]}
                      </div>
                    )}
                  </div>

                  <span style={{ fontSize: 'var(--fs-xs)', color: '#ffd700' }}>VS</span>

                  {/* Fighter 2 */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 'var(--fs-xs)',
                      color: m.winner === m.fighter2 ? '#22c55e' : m.winner ? '#555' : '#ddd',
                      fontWeight: m.fighter2?.name === player!.name ? 'bold' : 'normal',
                    }}>
                      {m.fighter2?.name || 'BYE'}
                    </div>
                    {m.fighter2 && (
                      <div style={{ fontSize: 7, color: STYLE_COLORS[m.fighter2.style] }}>
                        {STYLE_NAMES[m.fighter2.style]}
                      </div>
                    )}
                  </div>

                  {/* Result */}
                  {m.winner && (
                    <span style={{ fontSize: 7, color: '#22c55e' }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action button */}
          {getPlayerMatch() && !eliminated && (
            <button
              onClick={startPlayerMatch}
              style={{
                marginTop: 16, padding: '12px 30px', background: '#1a2a1a',
                color: '#ffd700', fontSize: 'var(--fs-md)', border: '2px solid #ffd700',
                width: '100%',
              }}
            >
              FIGHT — {roundNames[currentRound]}
            </button>
          )}
        </div>
      )}

      {/* Podium / results */}
      {phase === 'podium' && (
        <div style={{
          padding: 20, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 20, flex: 1, justifyContent: 'center',
        }}>
          {/* Medal icon */}
          <div style={{
            fontSize: 48, lineHeight: 1,
          }}>
            {placement === 'gold' ? '🥇' : placement === 'silver' ? '🥈' : placement === 'bronze' ? '🥉' : ''}
          </div>

          <div style={{
            fontSize: 'var(--fs-xxl)',
            color: placement === 'gold' ? '#ffd700' : placement === 'silver' ? '#c0c0c0' : placement === 'bronze' ? '#cd7f32' : '#888',
            textShadow: placement === 'gold' ? '0 0 20px #ffd70066' : 'none',
          }} className={placement === 'gold' ? 'blink' : ''}>
            {placement === 'gold' ? 'CHAMPION!' : placement === 'silver' ? 'SILVER MEDAL' : placement === 'bronze' ? 'BRONZE MEDAL' : 'ELIMINATED'}
          </div>

          <div style={{ fontSize: 'var(--fs-md)', color: '#aaa', textAlign: 'center' }}>
            {tournament.name}
          </div>

          {placement === 'gold' && (
            <div style={{ fontSize: 'var(--fs-xs)', color: '#888', textAlign: 'center', lineHeight: 1.8 }}>
              You fought through the entire bracket.<br/>
              The crowd is on their feet.
            </div>
          )}

          {placement !== 'out' && (
            <div style={{
              padding: '14px 28px', background: '#111',
              border: `2px solid ${placement === 'gold' ? '#ffd700' : placement === 'silver' ? '#c0c0c0' : '#cd7f32'}`,
              fontSize: 'var(--fs-lg)',
              color: placement === 'gold' ? '#ffd700' : placement === 'silver' ? '#c0c0c0' : '#cd7f32',
            }}>
              +${placement === 'gold' ? tournament.prizePool.gold
                : placement === 'silver' ? tournament.prizePool.silver
                : tournament.prizePool.bronze} Mat Bucks
            </div>
          )}

          {placement === 'out' && (
            <div style={{ fontSize: 'var(--fs-xs)', color: '#666', textAlign: 'center', lineHeight: 1.8 }}>
              You were eliminated. Train harder.<br/>
              Come back when you're ready.
            </div>
          )}

          <button
            onClick={handleFinish}
            style={{
              padding: '14px 36px', background: '#1a2a1a',
              color: '#22c55e', fontSize: 'var(--fs-md)', border: '2px solid #22c55e',
            }}
          >
            {placement === 'gold' ? 'CLAIM YOUR PRIZE' : 'BACK TO GYM'}
          </button>
        </div>
      )}
    </div>
  );
}
