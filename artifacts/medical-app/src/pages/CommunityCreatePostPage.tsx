import React, { useState, useRef, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonTextarea,
  IonInput,
  IonChip,
  IonLabel,
  IonButtons,
  IonBackButton,
  IonToast,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonCard,
  IonCardContent,
  IonBadge,
} from '@ionic/react';
import {
  image,
  link,
  send,
  close,
  add,
  people,
  sparkles,
  alertCircle,
  checkmarkCircle,
  repeat,
} from 'ionicons/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import AnimatedPage from '../components/AnimatedPage';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_CHARS = 2000;

interface Community {
  id: string;
  name: string;
  slug: string;
  member_count: number;
}

interface RepostData {
  original_post_id: string;
  original_author: string;
  original_content: string;
}

const CommunityCreatePostPage: React.FC = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');
  const [images, setImages] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [repostData, setRepostData] = useState<RepostData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;

  // Load communities and check for repost data
  useEffect(() => {
    loadCommunities();

    // Check if this is a repost
    const repostId = new URLSearchParams(window.location.search).get('repost');
    if (repostId) {
      loadRepostData(repostId);
    }
  }, []);

  const loadCommunities = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('community_members')
      .select(`
        community_id,
        communities:community_id (id, name, slug, member_count)
      `)
      .eq('user_id', user.id);

    if (data) {
      const comms = data
        .map((d: any) => d.communities)
        .filter(Boolean) as Community[];
      setCommunities(comms);
      if (comms.length > 0) {
        setSelectedCommunity(comms[0].id);
      }
    }
  };

  const loadRepostData = async (postId: string) => {
    const { data } = await supabase
      .from('posts')
      .select('id, content, user_id, profiles:user_id(full_name)')
      .eq('id', postId)
      .single();

    if (data) {
      setRepostData({
        original_post_id: data.id,
        original_author: data.profiles?.full_name || 'Unknown',
        original_content: data.content.substring(0, 150) + (data.content.length > 150 ? '...' : ''),
      });
      setContent('');
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim()) && tags.length < 5) {
      setTags([...tags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setToastMessage('Image must be under 5MB');
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('post-images')
      .upload(fileName, file);

    if (error) {
      setToastMessage('Failed to upload image');
      setToastColor('danger');
      setShowToast(true);
      setIsLoading(false);
      return;
    }

    const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
    setImages([...images, data.publicUrl]);
    setIsLoading(false);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() || !user || !selectedCommunity) return;
    if (isOverLimit) {
      setToastMessage(`Content exceeds ${MAX_CHARS} character limit`);
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    setIsLoading(true);

    const postData: any = {
      user_id: user.id,
      community_id: selectedCommunity,
      title: title.trim() || null,
      content: content.trim(),
      tags,
      images,
      link_url: linkUrl || null,
      post_type: 'community',
    };

    // Add repost data if present
    if (repostData) {
      postData.is_repost = true;
      postData.original_post_id = repostData.original_post_id;
    }

    const { error } = await supabase.from('posts').insert(postData);

    setIsLoading(false);

    if (error) {
      setToastMessage('Failed to create post. Try again.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setToastMessage(repostData ? 'Reposted to community!' : 'Post published successfully!');
    setToastColor('success');
    setShowToast(true);

    // Reset form
    setContent('');
    setTitle('');
    setTags([]);
    setImages([]);
    setLinkUrl('');
    setRepostData(null);

    setTimeout(() => {
      window.history.back();
    }, 1000);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-white">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/communities" />
          </IonButtons>
          <IonTitle className="font-semibold">
            {repostData ? 'Repost' : 'Community Post'}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={handleSubmit}
              disabled={!content.trim() || isLoading || isOverLimit || !selectedCommunity}
              color="primary"
              className="font-semibold"
            >
              {isLoading ? <IonSpinner name="crescent" /> : 'Post'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <AnimatedPage>
          <div className="p-4 space-y-4">
            {/* Community Selector */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <IonItem lines="none" className="bg-white rounded-xl --padding-start: 0">
                <IonIcon icon={people} slot="start" className="text-gray-400" />
                <IonSelect
                  value={selectedCommunity}
                  onIonChange={(e) => setSelectedCommunity(e.detail.value)}
                  placeholder="Select Community"
                  interface="popover"
                  className="w-full"
                >
                  {communities.map((comm) => (
                    <IonSelectOption key={comm.id} value={comm.id}>
                      <div className="flex items-center gap-2">
                        <span>{comm.name}</span>
                        <IonBadge color="light" className="text-xs">
                          {comm.member_count} members
                        </IonBadge>
                      </div>
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              {communities.length === 0 && (
                <p className="text-xs text-amber-600 mt-1 ml-2">
                  <IonIcon icon={alertCircle} className="inline mr-1" />
                  Join a community first to post
                </p>
              )}
            </motion.div>

            {/* Repost Card */}
            <AnimatePresence>
              {repostData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <IonCard className="m-0 bg-indigo-50 border border-indigo-200">
                    <IonCardContent className="py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <IonIcon icon={repeat} className="text-indigo-500" />
                        <span className="text-xs font-medium text-indigo-600">Reposting</span>
                      </div>
                      <p className="text-sm text-gray-600 italic">
                        "{repostData.original_content}"
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        — {repostData.original_author}
                      </p>
                    </IonCardContent>
                  </IonCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <IonInput
                value={title}
                onIonInput={(e) => setTitle(e.detail.value || '')}
                placeholder="Title (optional)"
                className="bg-white rounded-xl --padding-start: 16px font-semibold"
                style={{ '--padding-start': '16px' }}
              />
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <IonTextarea
                value={content}
                onIonInput={(e) => setContent(e.detail.value || '')}
                placeholder={repostData 
                  ? "Add your thoughts on this post..." 
                  : "Share with your community..."}
                rows={6}
                className="bg-white rounded-xl --padding-start: 16px"
                style={{ '--padding-start': '16px', '--padding-end': '16px' }}
              />
              <div className="absolute bottom-2 right-3 text-xs">
                <span className={isOverLimit ? 'text-red-500 font-medium' : 'text-gray-400'}>
                  {charCount}/{MAX_CHARS}
                </span>
              </div>
            </motion.div>

            {/* Character limit warning */}
            <AnimatePresence>
              {isOverLimit && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-red-500 text-sm"
                >
                  <IonIcon icon={alertCircle} />
                  <span>Content is {charCount - MAX_CHARS} characters over the limit</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Link Input */}
            <AnimatePresence>
              {showLinkInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2"
                >
                  <IonInput
                    value={linkUrl}
                    onIonInput={(e) => setLinkUrl(e.detail.value || '')}
                    placeholder="Paste URL here..."
                    type="url"
                    className="flex-1 bg-white rounded-xl"
                    style={{ '--padding-start': '16px' }}
                  />
                  <IonButton fill="clear" onClick={() => setShowLinkInput(false)}>
                    <IonIcon icon={close} />
                  </IonButton>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image Previews */}
            <AnimatePresence>
              {images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 overflow-x-auto pb-2"
                >
                  {images.map((img, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="relative flex-shrink-0"
                    >
                      <img
                        src={img}
                        alt="Upload preview"
                        className="w-24 h-24 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        <IonIcon icon={close} />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tags */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <p className="text-sm font-medium text-gray-700 mb-2">
                Tags {tags.length > 0 && <span className="text-gray-400">({tags.length}/5)</span>}
              </p>
              {tags.length < 5 && (
                <div className="flex items-center gap-2 mb-2">
                  <IonInput
                    value={customTag}
                    onIonInput={(e) => setCustomTag(e.detail.value || '')}
                    placeholder="Add tags (e.g., Cardiology, Research)..."
                    className="flex-1 bg-white rounded-full text-sm"
                    style={{ '--padding-start': '12px', '--padding-end': '12px' }}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                  />
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={addCustomTag}
                    disabled={!customTag.trim()}
                  >
                    <IonIcon icon={add} />
                  </IonButton>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <motion.button
                    key={tag}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTag(tag)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 text-white shadow-sm flex items-center gap-1"
                  >
                    {tag}
                    <IonIcon icon={close} className="text-xs" />
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 pt-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 4 || isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <IonIcon icon={image} />
                <span>Image {images.length > 0 && `(${images.length}/4)`}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowLinkInput(!showLinkInput)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
              >
                <IonIcon icon={link} />
                <span>Link</span>
              </motion.button>
            </motion.div>

            {/* Community Guidelines */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="bg-green-50 rounded-xl p-4 mt-4"
            >
              <div className="flex items-start gap-2">
                <IonIcon icon={sparkles} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-700">
                  <p className="font-medium mb-1">Community Guidelines</p>
                  <ul className="space-y-1 text-xs opacity-80">
                    <li>• Keep discussions respectful and constructive</li>
                    <li>• Share evidence-based information</li>
                    <li>• Support peers who are struggling</li>
                    <li>• No patient-identifying information ever</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatedPage>
      </IonContent>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
        color={toastColor}
      />
    </IonPage>
  );
};

export default CommunityCreatePostPage;
