import FeedScreen from '../views/feed-screen';
import AccessLoginScreen from '../views/access-login-screen';
import AccessRegisterScreen from '../views/access-register-screen';
import ComposerScreen from '../views/composer-screen';
import ArchivesScreen from '../views/archives-screen';
import ChronicleDetailScreen from '../views/chronicle-detail-screen';

const RouteManifest = {
  '/': new FeedScreen(),
  '/login': new AccessLoginScreen(),
  '/register': new AccessRegisterScreen(),
  '/add': new ComposerScreen(),
  '/favorite': new ArchivesScreen(),
  '/detail/:id': new ChronicleDetailScreen(),
};

export default RouteManifest;
