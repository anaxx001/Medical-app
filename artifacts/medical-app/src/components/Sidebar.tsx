import React, { useState, useEffect } from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonAvatar,
  IonButton,
  IonBadge,
  IonMenuToggle,
  IonToast,
} from '@ionic/react';
import {
  home,
  people,
  newspaper,
  chatbubbles,
  person,
  settings,
  logOut,
  heart,
  bookmark,
  school,
  shield,
  pulse,
  flask,
  sparkles,
  chevronForward,
} from 'ionicons/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

interface SidebarProps {
  userRole?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'app_admin';

  useEffect(() => {
    if (user) {
      loadProfile();
      loadUnreadCount();
      subscribeToNotifications();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, subscription_tier')
      .eq('id', user?.id)
      .single();
    if (data) setProfile(data);
  };

  const loadUnreadCount = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .eq('read', false);
    setUnreadCount(count || 0);
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('sidebar-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        () => loadUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: home },
    { path: '/feed', label: 'Feed', icon: newspaper },
    { path: '/communities', label: 'Communities', icon: people },
    { path: '/chatbot', label: 'Research Co-Pilot', icon: sparkles },
    { path: '/saved-posts', label: 'Saved Posts', icon: bookmark },
    { path: '/notifications', label: 'Notifications', icon: chatbubbles, badge: unreadCount },
    { path: '/profile', label: 'Profile', icon: person },
  ];

  const adminItems = [
    { path: '/admin/ai-models', label: 'AI Model Controls', icon: shield },
    { path: '/admin/users', label: 'User Management', icon: people },
    { path: '/admin/analytics', label: 'Analytics', icon: pulse },
  ];

  const handleLogout = async () => {
    await signOut();
    setShowToast(true);
  };

  return (
    <IonMenu contentId="main-content" side="start" type="overlay">
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gradient-to-br from-blue-600 to-indigo-700">
          <div className="p-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <IonAvatar className="w-12 h-12 border-2 border-white/30">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" />
                ) : (
                  <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center">
                    <IonIcon icon={person} className="text-white text-xl" />
                  </div>
                )}
              </IonAvatar>
              <div className="text-white">
                <p className="font-semibold text-sm">{profile?.full_name || 'Student'}</p>
                <div className="flex items-center gap-1">
                  <IonBadge color="light" className="text-xs px-2 py-0.5">
                    {profile?.subscription_tier || 'Free'}
                  </IonBadge>
                  {isAdmin && (
                    <IonBadge color="warning" className="text-xs px-2 py-0.5">
                      Admin
                    </IonBadge>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-white">
        <IonList lines="none" className="py-2">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <IonMenuToggle autoHide={false}>
                <IonItem
                  routerLink={item.path}
                  routerDirection="forward"
                  detail={false}
                  className="rounded-lg mx-2 hover:bg-gray-50 transition-colors"
                >
                  <IonIcon
                    icon={item.icon}
                    slot="start"
                    className="text-gray-500"
                  />
                  <IonLabel className="font-medium text-gray-700">{item.label}</IonLabel>
                  {item.badge ? (
                    <IonBadge color="danger" slot="end">
                      {item.badge > 99 ? '99+' : item.badge}
                    </IonBadge>
                  ) : (
                    <IonIcon icon={chevronForward} slot="end" className="text-gray-300 text-sm" />
                  )}
                </IonItem>
              </IonMenuToggle>
            </motion.div>
          ))}
        </IonList>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin
              </p>
            </div>
            <IonList lines="none" className="py-0">
              {adminItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (menuItems.length + index) * 0.05 }}
                >
                  <IonMenuToggle autoHide={false}>
                    <IonItem
                      routerLink={item.path}
                      routerDirection="forward"
                      detail={false}
                      className="rounded-lg mx-2 hover:bg-gray-50 transition-colors"
                    >
                      <IonIcon
                        icon={item.icon}
                        slot="start"
                        className="text-amber-500"
                      />
                      <IonLabel className="font-medium text-gray-700">{item.label}</IonLabel>
                      <IonIcon icon={chevronForward} slot="end" className="text-gray-300 text-sm" />
                    </IonItem>
                  </IonMenuToggle>
                </motion.div>
              ))}
            </IonList>
          </>
        )}

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          <IonMenuToggle autoHide={false}>
            <IonButton
              expand="block"
              fill="clear"
              color="medium"
              onClick={handleLogout}
              className="justify-start normal-case"
            >
              <IonIcon icon={logOut} slot="start" />
              Sign Out
            </IonButton>
          </IonMenuToggle>
        </div>
      </IonContent>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message="Signed out successfully"
        duration={2000}
        position="bottom"
        color="success"
      />
    </IonMenu>
  );
};

export default Sidebar;
