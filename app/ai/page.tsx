import type { Metadata } from 'next';
import { EcosphereAiPageLayout } from '@/components/ai/EcosphereAiPageLayout';

export const metadata: Metadata = {
  title: 'Ecosphere AI & Autonomous Agents | Ecosphere',
  description: 'AI incident intelligence, AgoraVoiceAI scribe, HolmesGPT telemetry, and automated postmortem drafters.',
};

export default function EcosphereAiPage() {
  return <EcosphereAiPageLayout />;
}
