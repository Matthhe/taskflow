import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import type { ITaskAttachment } from "../types";

const BUCKET = "task-attachments";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
];

const sanitizeFileName = (name: string) => {
  const lastDot = name.lastIndexOf(".");
  const ext = lastDot >= 0 ? name.slice(lastDot) : "";
  const base = (lastDot >= 0 ? name.slice(0, lastDot) : name)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
  return `${base || "file"}${ext.replace(/[^a-zA-Z0-9.]/g, "")}`;
};

const validateFile = (file: File) => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File is too large. Maximum size is 10 MB.");
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("This file type is not allowed.");
  }
};

export const useTaskAttachments = (taskId: string | undefined) => {
  const queryClient = useQueryClient();

  const attachmentsQuery = useQuery({
    queryKey: ["attachments", taskId],
    enabled: !!taskId,
    queryFn: async (): Promise<ITaskAttachment[]> => {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*, profiles(id, email, name, avatar_url)")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((row) => ({
        ...row,
        uploader: row.profiles ?? undefined,
      }));
    },
  });

  const uploadFile = useMutation({
    mutationFn: async ({ file, userId }: { file: File; userId: string }) => {
      if (!taskId) return;

      validateFile(file);

      const safeName = sanitizeFileName(file.name);
      const filePath = `${taskId}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("task_attachments")
        .insert([
          {
            task_id: taskId,
            uploaded_by: userId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
          },
        ]);

      if (insertError) {
        await supabase.storage.from(BUCKET).remove([filePath]);
        throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
    },
  });

  const deleteFile = useMutation({
    mutationFn: async (attachment: ITaskAttachment) => {
      const { error: dbError } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", attachment.id);
      if (dbError) throw dbError;

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([attachment.file_path]);
      if (storageError) {
        console.error("Failed to remove file from storage:", storageError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
    },
  });

  const getDownloadUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 60);
    if (error) throw error;
    return data.signedUrl;
  };

  return {
    attachments: attachmentsQuery.data ?? [],
    isLoading: attachmentsQuery.isLoading,
    uploadFile,
    deleteFile,
    getDownloadUrl,
  };
};
