import { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useClientInteractions } from '@/hooks/useClientInteractions';

interface ClientHealthData {
  score: number;
  status: 'healthy' | 'attention' | 'critical';
  factors: {
    activeProjects: number;
    paymentHealth: number;
    recentInteraction: number;
    campaignPerformance: number;
  };
  recommendations: string[];
}

export function useClientHealth(clientId: string) {
  const { projects } = useProjects();
  const { interactions } = useClientInteractions(clientId);

  const healthData = useMemo((): ClientHealthData => {
    const clientProjects = projects.filter(p => p.client_id === clientId);
    const activeProjects = clientProjects.filter(p => p.status === 'active');
    const completedProjects = clientProjects.filter(p => p.status === 'completed');

    // Fator 1: Projetos ativos (30%)
    const activeProjectsScore = Math.min(activeProjects.length * 25, 100);

    // Fator 2: Saúde de pagamentos (30%)
    // Baseado em projetos completados vs ativos
    const paymentHealthScore = clientProjects.length > 0
      ? (completedProjects.length / clientProjects.length) * 100
      : 50;

    // Fator 3: Interação recente (20%)
    const recentInteractions = interactions.filter(i => {
      const date = new Date(i.interaction_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date > thirtyDaysAgo;
    });
    const interactionScore = Math.min(recentInteractions.length * 20, 100);

    // Fator 4: Performance de campanhas (20%)
    // Placeholder - seria calculado com dados reais de campaign_metrics
    const campaignScore = activeProjects.length > 0 ? 70 : 50;

    // Cálculo do score final
    const finalScore = Math.round(
      activeProjectsScore * 0.3 +
      paymentHealthScore * 0.3 +
      interactionScore * 0.2 +
      campaignScore * 0.2
    );

    // Determinar status
    let status: ClientHealthData['status'];
    if (finalScore >= 70) {
      status = 'healthy';
    } else if (finalScore >= 40) {
      status = 'attention';
    } else {
      status = 'critical';
    }

    // Gerar recomendações
    const recommendations: string[] = [];
    if (activeProjectsScore < 50) {
      recommendations.push('Considere propor novos projetos para este cliente');
    }
    if (interactionScore < 50) {
      recommendations.push('Faça contato com o cliente - última interação foi há mais de 30 dias');
    }
    if (paymentHealthScore < 50) {
      recommendations.push('Verifique pendências de pagamento');
    }

    return {
      score: finalScore,
      status,
      factors: {
        activeProjects: activeProjectsScore,
        paymentHealth: paymentHealthScore,
        recentInteraction: interactionScore,
        campaignPerformance: campaignScore,
      },
      recommendations,
    };
  }, [projects, interactions, clientId]);

  return healthData;
}
