import React, { useState, useRef } from 'react';
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
  sparkles,
  alertCircle,
  checkmarkCircle,
} from 'ionicons/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import AnimatedPage from '../components/AnimatedPage';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_CHARS = 2000;
const SUGGESTED_TAGS = [
  'Research', 'Study Tips', 'Mental Health', 'Clinical', 'Anatomy',
  'Pharmacology', 'Pathology', 'Exam Prep', 'Career', 'Wellness',
];

const CreatePostPage: React.FC = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');
  const [images, setImages] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;

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
    if (!content.trim() || !user) return;
    if (isOverLimit) {
      setToastMessage(`Content exceeds ${MAX_CHARS} character limit`);
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      title: title.trim() || null,
      content: content.trim(),
      tags,
      images,
      link_url: linkUrl || null,
      post_type: 'general',
    });

    setIsLoading(false);

    if (error) {
      setToastMessage('Failed to create post. Try again.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setToastMessage('Post published successfully!');
    setToastColor('success');
    setShowToast(true);

    // Reset form
    setContent('');
    setTitle('');
    setTags([]);
    setImages([]);
    setLinkUrl('');

    // Navigate back after short delay
    setTimeout(() => {
      window.history.back();
    }, 1000);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-white">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/feed" />
          </IonButtons>
          <IonTitle className="font-semibold">Create Post</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={handleSubmit}
              disabled={!content.trim() || isLoading || isOverLimit}
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
            {/* Title (optional) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
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
              transition={{ delay: 0.05 }}
              className="relative"
            >
              <IonTextarea
                value={content}
                onIonInput={(e) => setContent(e.detail.value || '')}
                placeholder="What's on your mind? Share research insights, study tips, or ask the community..."
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
              transition={{ delay: 0.1 }}
            >
              <p className="text-sm font-medium text-gray-700 mb-2">
                Tags {tags.length > 0 && <span className="text-gray-400">({tags.length}/5)</span>}
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {SUGGESTED_TAGS.map((tag) => (
                  <motion.button
                    key={tag}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      tags.includes(tag)
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {tag}
                  </motion.button>
                ))}
              </div>
              {tags.length < 5 && (
                <div className="flex items-center gap-2">
                  <IonInput
                    value={customTag}
                    onIonInput={(e) => setCustomTag(e.detail.value || '')}
                    placeholder="Add custom tag..."
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
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
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

            {/* Post Tips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-blue-50 rounded-xl p-4 mt-4"
            >
              <div className="flex items-start gap-2">
                <IonIcon icon={sparkles} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Post Tips</p>
                  <ul className="space-y-1 text-xs opacity-80">
                    <li>• Share original research insights or study strategies</li>
                    <li>• Tag your post so others can find it easily</li>
                    <li>• Keep it respectful and supportive</li>
                    <li>• Add images to make your post more engaging</li>
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

export default CreatePostPage;
