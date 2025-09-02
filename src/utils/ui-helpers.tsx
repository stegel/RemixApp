export const getScoreColor = (score: number): string => {
  // 0-4 scale: 0=Strongly Disagree, 4=Strongly Agree
  if (score >= 3.2) return 'bg-accent text-accent-foreground'; // High performance (equivalent to old 4+)
  if (score >= 2.0) return 'bg-muted text-muted-foreground'; // Medium performance (equivalent to old 3+)
  return 'bg-destructive text-destructive-foreground'; // Low performance (below 2.0)
};

export const getAILevel = (averageTotalScore: number): { level: string; color: string } => {
  // Based on average total score out of 20
  if (averageTotalScore >= 16) return { level: 'Agentic Ace', color: 'bg-accent text-accent-foreground' };
  if (averageTotalScore >= 11) return { level: 'Cognitive Crafter', color: 'bg-primary text-primary-foreground' };
  if (averageTotalScore >= 6) return { level: 'Neural Novice', color: 'bg-chart-3 text-card-foreground' };
  return { level: 'Booting Bot', color: 'bg-destructive text-destructive-foreground' };
};

export const typographyStyles = {
  h1: {
    fontFamily: 'var(--font-family-cabin)', 
    fontSize: 'var(--text-h1)', 
    fontWeight: 'var(--font-weight-bold)'
  },
  h2: {
    fontFamily: 'var(--font-family-cabin)', 
    fontSize: 'var(--text-h2)', 
    fontWeight: 'var(--font-weight-bold)'
  },
  h4: {
    fontFamily: 'var(--font-family-lato)', 
    fontSize: 'var(--text-h4)', 
    fontWeight: 'var(--font-weight-semibold)'
  },
  body: {
    fontFamily: 'var(--font-family-lato)', 
    fontSize: 'var(--text-base)', 
    fontWeight: 'var(--font-weight-regular)'
  },
  label: {
    fontFamily: 'var(--font-family-lato)', 
    fontSize: 'var(--text-label)', 
    fontWeight: 'var(--font-weight-regular)'
  },
  muted: {
    fontFamily: 'var(--font-family-lato)', 
    fontSize: 'var(--text-base)', 
    fontWeight: 'var(--font-weight-regular)',
    color: 'var(--muted-foreground)'
  }
};