import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Trash2, ExternalLink, AlertCircle, Chrome } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Tweet {
  id: string;
  userName: string;
  userHandle: string;
  text: string;
  images: string[];
  videoUrl: string;
  url: string;
  timestamp: string;
  captured: string;
}

// 同步检测是否在扩展环境中
const IS_EXTENSION = typeof chrome !== 'undefined' && 
  typeof chrome.runtime !== 'undefined' && 
  typeof chrome.runtime.id !== 'undefined';

export default function Index() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!IS_EXTENSION) return;

    const loadTweets = async () => {
      try {
        const result = await chrome.storage.local.get(['tweets']);
        if (result.tweets) {
          const loadedTweets = result.tweets as Tweet[];
          setTweets(loadedTweets);
          setSelectedIds(new Set(loadedTweets.map(t => t.id)));
        }
      } catch (error) {
        console.error('Error loading tweets:', error);
      }
    };

    loadTweets();

    // 监听 storage 变化（content script 写入时触发）
    const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.tweets?.newValue) {
        const newTweets = changes.tweets.newValue as Tweet[];
        setTweets(newTweets);
        setSelectedIds(new Set(newTweets.map(t => t.id)));
        toast.success('推文已抓取！');
      }
    };

    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === tweets.length ? new Set() : new Set(tweets.map(t => t.id)));
  };

  const deleteTweet = (id: string) => {
    setTweets(prev => {
      const updated = prev.filter(t => t.id !== id);
      if (IS_EXTENSION) chrome.storage.local.set({ tweets: updated });
      return updated;
    });
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    toast.success('已删除');
  };

  const exportToMarkdown = async () => {
    const selected = tweets.filter(t => selectedIds.has(t.id));
    if (selected.length === 0) {
      toast.error('请至少选择一条推文');
      return;
    }

    toast.info('正在生成...');
    let md = `# 推特内容合集\n\n导出时间：${new Date().toLocaleString('zh-CN')}\n\n共 ${selected.length} 条推文\n\n---\n\n`;

    for (const t of selected) {
      md += `## ${t.userName}\n\n**用户：** ${t.userHandle}\n\n**时间：** ${new Date(t.timestamp).toLocaleString('zh-CN')}\n\n**链接：** [原推文](${t.url})\n\n`;
      if (t.text) md += `### 内容\n\n${t.text}\n\n`;
      if (t.images.length > 0) {
        md += `### 图片\n\n`;
        t.images.forEach((img, i) => { md += `![图片${i + 1}](${img})\n\n`; });
      }
      if (t.videoUrl) md += `### 视频\n\n[视频链接](${t.videoUrl})\n\n`;
      md += '---\n\n';
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `twitter-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('已下载！');
  };

  // 非扩展环境显示安装说明
  if (!IS_EXTENSION) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-2xl w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Chrome className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-3xl mb-2">推特内容抓取器</CardTitle>
            <CardDescription className="text-base">Chrome 浏览器扩展程序</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-900 dark:text-amber-200">
                <p className="font-semibold mb-1">需要作为浏览器扩展运行</p>
                <p>当前在网页预览环境，请按以下步骤安装。</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                构建扩展
              </h3>
              <div className="ml-8 p-4 bg-muted rounded-lg">
                <code className="text-sm">npm install --legacy-peer-deps<br />npm run build</code>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                加载到 Chrome
              </h3>
              <ul className="ml-8 space-y-2 text-sm text-muted-foreground">
                <li>• 访问 <code className="px-2 py-1 bg-muted rounded">chrome://extensions/</code></li>
                <li>• 开启"开发者模式"</li>
                <li>• 点击"加载已解压的扩展程序"</li>
                <li>• 选择 <code className="px-2 py-1 bg-muted rounded">dist</code> 文件夹</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                使用
              </h3>
              <ul className="ml-8 space-y-2 text-sm text-muted-foreground">
                <li>• 访问 Twitter/X 网站</li>
                <li>• 点击扩展图标打开侧边栏</li>
                <li>• 点击推文上的"抓取"按钮</li>
              </ul>
            </div>

            <div className="pt-4 border-t grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span>一键抓取</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span>支持图片视频</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span>表格管理</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span>导出 Markdown</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b bg-card p-4">
        <h1 className="text-xl font-bold text-foreground mb-2">推特内容抓取器</h1>
        <p className="text-sm text-muted-foreground">在推特页面点击"抓取"按钮添加到列表</p>
      </div>

      <div className="border-b bg-card p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Checkbox checked={tweets.length > 0 && selectedIds.size === tweets.length} onCheckedChange={toggleSelectAll} id="select-all" />
          <label htmlFor="select-all" className="text-sm text-foreground cursor-pointer">已选 {selectedIds.size}/{tweets.length}</label>
        </div>
        <Button onClick={exportToMarkdown} disabled={selectedIds.size === 0} size="sm">
          <Download className="w-4 h-4 mr-2" />下载 Markdown
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {tweets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">还没有抓取推文</p>
            <p className="text-sm mt-2">前往推特页面，点击"抓取"按钮开始收集</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">选择</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>内容</TableHead>
                <TableHead>媒体</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tweets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell><Checkbox checked={selectedIds.has(t.id)} onCheckedChange={() => toggleSelect(t.id)} /></TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{t.userName}</div>
                    <div className="text-xs text-muted-foreground">{t.userHandle}</div>
                  </TableCell>
                  <TableCell className="max-w-md"><div className="line-clamp-3 text-sm text-foreground">{t.text}</div></TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {t.images.length > 0 && <span>{t.images.length}张图片</span>}
                      {t.videoUrl && <span>1个视频</span>}
                      {!t.images.length && !t.videoUrl && <span>无媒体</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(t.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => window.open(t.url, '_blank')} title="查看原推文"><ExternalLink className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteTweet(t.id)} title="删除"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  );
}