"use client";

import {ShopPage} from './shop-page';
import {LeaderboardPage} from './leaderboard-panel';
import {CommunityPage} from './community-page';
import {ProfilePage} from './profile-page';
import {MissionsPage} from './missions-page';
import {NotesPage} from './notes-page';
import {VocabularyPage} from './vocabulary-page';
import {FeedbackPage} from './feedback-page';
import {SettingsPage} from './settings-page';

export {LeaderboardPanel} from './leaderboard-panel';

export function SocialPage({page}: {page: string}) {
  switch (page) {
    case 'shop': return <ShopPage/>;
    case 'leaderboard': return <LeaderboardPage/>;
    case 'community': return <CommunityPage/>;
    case 'profile': return <ProfilePage/>;
    case 'missions': return <MissionsPage/>;
    case 'my-notes': return <NotesPage/>;
    case 'my-vocabulary': return <VocabularyPage/>;
    case 'feedbacks': return <FeedbackPage/>;
    case 'settings': return <SettingsPage/>;
    default: return null;
  }
}
