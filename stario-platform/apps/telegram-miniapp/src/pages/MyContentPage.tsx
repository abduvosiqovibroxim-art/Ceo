import { motion } from 'framer-motion';
import { PlayIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

const mockContent = [
  { id: '1', artist: 'Artist One', occasion: 'Birthday', status: 'completed', date: '2024-01-15' },
  { id: '2', artist: 'Artist Two', occasion: 'Congratulations', status: 'processing', date: '2024-01-18' },
  { id: '3', artist: 'Artist Three', occasion: 'Motivation', status: 'completed', date: '2024-01-10' },
];

export default function MyContentPage() {
  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-tg-text mb-2">My Content</h1>
      <p className="text-tg-hint mb-6">Your personalized video moments</p>

      {mockContent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-24 h-24 rounded-full bg-tg-secondary-bg flex items-center justify-center mb-4">
            <PlayIcon className="w-10 h-10 text-tg-hint" />
          </div>
          <p className="text-tg-hint text-center">
            You haven't created any moments yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mockContent.map((content, index) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-4 p-4 rounded-2xl bg-tg-secondary-bg"
            >
              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-stario-purple to-stario-pink flex items-center justify-center flex-shrink-0">
                {content.status === 'completed' ? (
                  <PlayIcon className="w-8 h-8 text-white" />
                ) : (
                  <ClockIcon className="w-8 h-8 text-white animate-pulse" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-tg-text truncate">
                  {content.artist}
                </h3>
                <p className="text-sm text-tg-hint">{content.occasion}</p>
                <p className="text-xs text-tg-hint mt-1">{content.date}</p>
              </div>

              {/* Status */}
              <div className="flex items-start">
                {content.status === 'completed' ? (
                  <span className="flex items-center gap-1 text-xs text-green-500">
                    <CheckCircleIcon className="w-4 h-4" />
                    Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-orange-500">
                    <ClockIcon className="w-4 h-4" />
                    Processing
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
