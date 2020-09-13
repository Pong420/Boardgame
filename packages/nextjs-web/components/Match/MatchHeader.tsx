import React, { ReactNode } from 'react';
import { useRxAsync } from 'use-rx-hooks';
import { Button } from '@blueprintjs/core';
import { ButtonPopover } from '@/components/ButtonPopover';
import { leaveMatchAndRedirect, matchStorage } from '@/services';
import { Toaster } from '@/utils/toaster';
import styles from './Match.module.scss';

interface Props {
  title?: ReactNode;
  children?: ReactNode;
}

const onFailure = Toaster.apiError.bind(Toaster, 'Leave Match Failure');

function LeaveMatchButton() {
  const [{ loading }, { fetch }] = useRxAsync(leaveMatchAndRedirect, {
    defer: true,
    onFailure
  });

  return (
    <ButtonPopover
      minimal
      icon="arrow-left"
      content="Leave match"
      loading={loading}
      onClick={() => fetch(matchStorage.get())}
    />
  );
}

export function MatchHeader({ title, children }: Props) {
  return (
    <div className={styles['match-header']}>
      <div>
        <LeaveMatchButton />
        <Button minimal icon="blank" style={{ visibility: 'hidden' }} />
      </div>
      <div className={styles['match-header-title']}>{title}</div>
      <div>{children}</div>
    </div>
  );
}
