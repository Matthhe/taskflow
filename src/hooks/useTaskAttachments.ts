import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import type { ITaskAttachment } from "../types";

const BUCKET = "task-attachments";

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
      const filePath = `${taskId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file);
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
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
    },
  });

  const deleteFile = useMutation({
    mutationFn: async (attachment: ITaskAttachment) => {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([attachment.file_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", attachment.id);
      if (dbError) throw dbError;
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
