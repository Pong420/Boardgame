import React, { useState } from 'react';
import Head from 'next/head';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Layout } from '@/components/Layout';
import { Redirect } from '@/components/Redirect';
import { gameMetaMap, gameMetadata } from '@/games';
import { historyState, MatchState } from '@/services';

type Params = {
  name: string;
};

interface Props {
  name: string;
}

export default function MatchPage({ name }: Props) {
  const meta = gameMetaMap[name];
  const [state] = useState<MatchState>(historyState.get());

  if (state && meta) {
    return (
      <Layout>
        <Head>
          <title>Lobby | {meta.gameName}</title>
        </Head>
        <div>Match</div>
      </Layout>
    );
  }

  return <Redirect />;
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  return {
    paths: gameMetadata.map(({ name }) => ({ params: { name } })),
    fallback: false
  };
};

export const getStaticProps: GetStaticProps<Props, Params> = async ({
  params
}) => ({
  props: {
    name: params.name
  }
});